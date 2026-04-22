"""
Matchmaking Service — upgraded with ELO, queue intelligence, match history
"""
import uuid
import math
from django.utils import timezone
from django.db.models import Avg, Q

from .models import Player, Match, get_tier

BASE_SKILL_RANGE      = 100
SKILL_RANGE_PER_SECOND = 3
MAX_SKILL_RANGE       = 600
ELO_K                 = 32   # K-factor


# ── helpers ──────────────────────────────────────────────────────────────────

def generate_session_id() -> str:
    return str(uuid.uuid4())


def get_skill_range(player: Player) -> int:
    expansion = min(player.wait_seconds * SKILL_RANGE_PER_SECOND, MAX_SKILL_RANGE)
    return int(BASE_SKILL_RANGE + expansion)


def _elo_expected(rating_a: int, rating_b: int) -> float:
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))


def _update_elo(winner: Player, loser: Player):
    exp_w = _elo_expected(winner.elo, loser.elo)
    exp_l = _elo_expected(loser.elo, winner.elo)
    winner.elo = max(0, winner.elo + round(ELO_K * (1 - exp_w)))
    loser.elo  = max(0, loser.elo  + round(ELO_K * (0 - exp_l)))
    winner.wins   += 1
    loser.losses  += 1
    winner.save()
    loser.save()


def _win_probability(p1_elo: int, p2_elo: int) -> float:
    """Returns win probability for p1 (0–100)."""
    return round(_elo_expected(p1_elo, p2_elo) * 100, 1)


# ── queue ─────────────────────────────────────────────────────────────────────

def add_player(name: str, skill: int, region: str, game_mode: str) -> dict:
    session_id = generate_session_id()
    skill = max(0, min(3000, skill))
    player = Player.objects.create(
        name=name, skill=skill, region=region, game_mode=game_mode,
        session_id=session_id, status='queuing', elo=skill,
    )
    return {
        'player_id': player.id, 'session_id': session_id,
        'name': player.name, 'skill': player.skill,
        'region': player.region, 'game_mode': player.game_mode,
        'status': player.status, 'join_time': player.join_time.isoformat(),
        'tier': player.tier,
    }


def remove_player(session_id: str) -> dict:
    try:
        player = Player.objects.get(session_id=session_id, status='queuing')
        player.status = 'left'
        player.save()
        return {'success': True, 'message': f'{player.name} left the queue.'}
    except Player.DoesNotExist:
        return {'success': False, 'message': 'Player not in queue or already matched.'}


def get_player_status(session_id: str) -> dict:
    try:
        player = Player.objects.get(session_id=session_id)
    except Player.DoesNotExist:
        return {'error': 'Player not found.'}

    skill_range = get_skill_range(player)

    # Queue position = players who joined before this one and are still queuing
    queue_position = Player.objects.filter(
        status='queuing', join_time__lt=player.join_time
    ).count() + 1

    # Estimated wait: rough heuristic based on queue size and avg match rate
    queuing_count = Player.objects.filter(status='queuing').count()
    estimated_wait = max(5, int((queue_position / max(queuing_count, 1)) * 60))

    data = {
        'player_id': player.id,
        'name': player.name,
        'skill': player.skill,
        'region': player.region,
        'game_mode': player.game_mode,
        'status': player.status,
        'wait_seconds': player.wait_seconds,
        'queue_position': queue_position if player.status == 'queuing' else None,
        'estimated_wait_time': estimated_wait if player.status == 'queuing' else None,
        'current_skill_range': skill_range,
        'elo': player.elo,
        'tier': player.tier,
        'wins': player.wins,
        'losses': player.losses,
        'win_rate': player.win_rate,
    }

    if player.status == 'matched':
        match = (
            Match.objects.filter(player1=player).first()
            or Match.objects.filter(player2=player).first()
        )
        if match:
            data['match_id'] = match.id

    return data


def find_match(session_id: str) -> dict:
    try:
        player = Player.objects.get(session_id=session_id, status='queuing')
    except Player.DoesNotExist:
        return {'matched': False, 'reason': 'Player not in queue.'}

    skill_range = get_skill_range(player)

    # Progressive relaxation
    candidates = Player.objects.filter(
        status='queuing', region=player.region, game_mode=player.game_mode,
        skill__gte=player.skill - skill_range, skill__lte=player.skill + skill_range,
    ).exclude(id=player.id).order_by('join_time')

    if not candidates.exists() and player.wait_seconds > 30:
        candidates = Player.objects.filter(
            status='queuing', game_mode=player.game_mode,
            skill__gte=player.skill - skill_range, skill__lte=player.skill + skill_range,
        ).exclude(id=player.id).order_by('join_time')

    if not candidates.exists() and player.wait_seconds > 60:
        candidates = Player.objects.filter(
            status='queuing',
            skill__gte=player.skill - skill_range, skill__lte=player.skill + skill_range,
        ).exclude(id=player.id).order_by('join_time')

    if not candidates.exists():
        return {'matched': False, 'reason': 'No suitable opponent found yet.', 'skill_range': skill_range}

    best = None
    best_score = float('inf')
    for c in candidates[:20]:
        gap = abs(player.skill - c.skill)
        wait_bonus = min(c.wait_seconds / 60.0, 1.0) * 50
        score = gap - wait_bonus
        if score < best_score:
            best_score = score
            best = c

    if not best:
        return {'matched': False, 'reason': 'No suitable opponent found yet.', 'skill_range': skill_range}

    skill_gap = abs(player.skill - best.skill)
    quality   = calculate_match_quality(player, best, skill_gap)
    avg_wait  = (player.wait_seconds + best.wait_seconds) / 2
    win_prob  = _win_probability(player.elo, best.elo)

    match = Match.objects.create(
        player1=player, player2=best,
        skill_gap=skill_gap,
        region=player.region if player.region == best.region else 'Mixed',
        game_mode=player.game_mode,
        match_quality=quality,
        avg_wait_time=avg_wait,
        p1_elo_before=player.elo,
        p2_elo_before=best.elo,
    )

    player.status = 'matched'
    best.status   = 'matched'
    player.save()
    best.save()

    return {
        'matched': True,
        'match_id': match.id,
        'opponent': _player_dict(best),
        'skill_gap': skill_gap,
        'match_quality': round(quality, 1),
        'avg_wait_time': round(avg_wait, 1),
        'win_probability': win_prob,
        'region_match': player.region == best.region,
        'mode_match': player.game_mode == best.game_mode,
    }


def get_match_result(session_id: str) -> dict:
    try:
        player = Player.objects.get(session_id=session_id)
    except Player.DoesNotExist:
        return {'error': 'Player not found.'}

    match = (
        Match.objects.filter(player1=player).first()
        or Match.objects.filter(player2=player).first()
    )
    if not match:
        return {'error': 'No match found.'}

    opponent = match.player2 if match.player1_id == player.id else match.player1
    win_prob = _win_probability(player.elo, opponent.elo if opponent else 1200)

    return {
        'match_id': match.id,
        'you': _player_dict(player),
        'opponent': _player_dict(opponent) if opponent else {},
        'skill_gap': match.skill_gap,
        'match_quality': match.match_quality,
        'avg_wait_time': match.avg_wait_time,
        'win_probability': win_prob,
        'region_match': match.region != 'Mixed',
        'result_recorded': match.result_recorded,
        'winner_id': match.winner_id,
        'p1_elo_before': match.p1_elo_before,
        'p2_elo_before': match.p2_elo_before,
        'p1_elo_after': match.p1_elo_after,
        'p2_elo_after': match.p2_elo_after,
        'created_at': match.created_at.isoformat(),
    }


def record_match_result(match_id: int, winner_id: int) -> dict:
    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return {'error': 'Match not found.'}

    if match.result_recorded:
        return {'error': 'Result already recorded for this match.'}

    p1, p2 = match.player1, match.player2
    if not p1 or not p2:
        return {'error': 'One or both players no longer exist.'}

    if winner_id == p1.id:
        winner, loser = p1, p2
    elif winner_id == p2.id:
        winner, loser = p2, p1
    else:
        return {'error': 'winner_id must be one of the match players.'}

    # Snapshot before
    p1_before, p2_before = p1.elo, p2.elo

    _update_elo(winner, loser)

    match.winner = winner
    match.result_recorded = True
    match.p1_elo_before = p1_before
    match.p2_elo_before = p2_before
    match.p1_elo_after  = p1.elo
    match.p2_elo_after  = p2.elo
    match.save()

    return {
        'success': True,
        'winner': winner.name,
        'loser': loser.name,
        'elo_changes': {
            winner.name: {'before': p1_before if winner == p1 else p2_before,
                          'after': winner.elo,
                          'delta': winner.elo - (p1_before if winner == p1 else p2_before)},
            loser.name:  {'before': p2_before if loser == p2 else p1_before,
                          'after': loser.elo,
                          'delta': loser.elo - (p2_before if loser == p2 else p1_before)},
        }
    }


def get_match_history(session_id: str = None, limit: int = 20) -> list:
    if session_id:
        try:
            player = Player.objects.get(session_id=session_id)
        except Player.DoesNotExist:
            return []
        matches = Match.objects.filter(
            Q(player1=player) | Q(player2=player),
            result_recorded=True
        ).order_by('-created_at')[:limit]
    else:
        matches = Match.objects.filter(result_recorded=True).order_by('-created_at')[:limit]

    result = []
    for m in matches:
        p1, p2 = m.player1, m.player2
        result.append({
            'match_id': m.id,
            'player1': _player_dict(p1) if p1 else {},
            'player2': _player_dict(p2) if p2 else {},
            'winner_id': m.winner_id,
            'winner_name': m.winner.name if m.winner else None,
            'skill_gap': m.skill_gap,
            'match_quality': m.match_quality,
            'p1_elo_before': m.p1_elo_before,
            'p2_elo_before': m.p2_elo_before,
            'p1_elo_after': m.p1_elo_after,
            'p2_elo_after': m.p2_elo_after,
            'created_at': m.created_at.isoformat(),
        })
    return result


def calculate_match_quality(p1: Player, p2: Player, skill_gap: int) -> float:
    skill_score  = max(0, 60 - (skill_gap / 10))
    region_score = 20 if p1.region == p2.region else 0
    mode_score   = 20 if p1.game_mode == p2.game_mode else 0
    return round(skill_score + region_score + mode_score, 1)


def get_lobby_stats() -> dict:
    queuing      = Player.objects.filter(status='queuing').count()
    matched      = Player.objects.filter(status='matched').count()
    total_players = Player.objects.exclude(status='left').count()
    total_matches = Match.objects.count()
    matches_today = Match.objects.filter(created_at__date=timezone.now().date()).count()
    avg_quality  = Match.objects.aggregate(Avg('match_quality'))['match_quality__avg'] or 0
    avg_wait     = Match.objects.aggregate(Avg('avg_wait_time'))['avg_wait_time__avg'] or 0
    avg_gap      = Match.objects.aggregate(Avg('skill_gap'))['skill_gap__avg'] or 0

    return {
        'queuing_players': queuing,
        'matched_players': matched,
        'total_players': total_players,
        'players_online': queuing,
        'matches_today': matches_today,
        'total_matches': total_matches,
        'avg_match_quality': round(avg_quality, 1),
        'avg_wait_time': round(avg_wait, 1),
        'avg_skill_gap': round(avg_gap, 1),
    }


def _player_dict(p: Player) -> dict:
    if not p:
        return {}
    return {
        'id': p.id, 'name': p.name, 'skill': p.skill,
        'region': p.region, 'game_mode': p.game_mode,
        'elo': p.elo, 'tier': p.tier,
        'wins': p.wins, 'losses': p.losses, 'win_rate': p.win_rate,
    }
