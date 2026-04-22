from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Q

from .models import Player, Match, SimulationResult
from . import services
from .algorithms import run_greedy, run_graph


# ── Queue ─────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def join_queue(request):
    d = request.data
    name      = d.get('name', '').strip()
    skill     = d.get('skill')
    region    = d.get('region', '').strip()
    game_mode = d.get('game_mode', '').strip()

    errors = {}
    if not name:      errors['name'] = 'Name is required.'
    if not region:    errors['region'] = 'Region is required.'
    if not game_mode: errors['game_mode'] = 'Game mode is required.'
    if skill is None:
        errors['skill'] = 'Skill rating is required.'
    else:
        try:
            skill = int(skill)
            if not (0 <= skill <= 3000):
                errors['skill'] = 'Skill must be 0–3000.'
        except (ValueError, TypeError):
            errors['skill'] = 'Skill must be a number.'

    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

    return Response(services.add_player(name, skill, region, game_mode), status=status.HTTP_201_CREATED)


@api_view(['POST'])
def leave_queue(request):
    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'session_id required.'}, status=status.HTTP_400_BAD_REQUEST)
    result = services.remove_player(session_id)
    code = 200 if result['success'] else 404
    return Response(result, status=code)


@api_view(['GET'])
def player_status(request):
    session_id = request.query_params.get('session_id')
    if not session_id:
        return Response({'error': 'session_id required.'}, status=status.HTTP_400_BAD_REQUEST)
    result = services.get_player_status(session_id)
    if 'error' in result:
        return Response(result, status=status.HTTP_404_NOT_FOUND)
    return Response(result)


@api_view(['GET'])
def find_match(request):
    session_id = request.query_params.get('session_id')
    if not session_id:
        return Response({'error': 'session_id required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        player = Player.objects.get(session_id=session_id)
    except Player.DoesNotExist:
        return Response({'error': 'Player not found.'}, status=status.HTTP_404_NOT_FOUND)

    if player.status == 'matched':
        return Response(services.get_match_result(session_id))
    return Response(services.find_match(session_id))


# ── Match Result + ELO ────────────────────────────────────────────────────────

@api_view(['POST'])
def match_result(request):
    match_id  = request.data.get('match_id')
    winner_id = request.data.get('winner_id')
    if not match_id or not winner_id:
        return Response({'error': 'match_id and winner_id required.'}, status=status.HTTP_400_BAD_REQUEST)
    result = services.record_match_result(int(match_id), int(winner_id))
    if 'error' in result:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    return Response(result)


# ── Match History ─────────────────────────────────────────────────────────────

@api_view(['GET'])
def match_history(request):
    session_id = request.query_params.get('session_id')
    limit = int(request.query_params.get('limit', 20))
    data = services.get_match_history(session_id=session_id, limit=limit)
    return Response({'history': data, 'total': len(data)})


# ── Stats ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def lobby_stats(request):
    return Response(services.get_lobby_stats())


# ── Leaderboard ───────────────────────────────────────────────────────────────

@api_view(['GET'])
def leaderboard(request):
    region    = request.query_params.get('region')
    game_mode = request.query_params.get('mode')

    qs = Player.objects.exclude(status='left')
    if region:    qs = qs.filter(region=region)
    if game_mode: qs = qs.filter(game_mode=game_mode)
    qs = qs.order_by('-elo', '-wins')[:50]

    data = []
    for rank, p in enumerate(qs, 1):
        data.append({
            'rank': rank, 'id': p.id, 'name': p.name,
            'elo': p.elo, 'tier': p.tier,
            'wins': p.wins, 'losses': p.losses, 'win_rate': p.win_rate,
            'region': p.region, 'game_mode': p.game_mode,
        })
    return Response({'leaderboard': data, 'total': len(data)})


# ── Simulation ────────────────────────────────────────────────────────────────

@api_view(['POST'])
def simulate(request):
    d         = request.data
    algorithm = d.get('algorithm', 'greedy')
    count     = d.get('player_count', 100)
    skill_std = d.get('skill_std', 400)   # new: adjustable skill spread

    try:
        count     = max(10, min(1000, int(count)))
        skill_std = max(50, min(800, int(skill_std)))
    except (ValueError, TypeError):
        return Response({'error': 'Invalid parameters.'}, status=status.HTTP_400_BAD_REQUEST)

    if algorithm not in ('greedy', 'graph'):
        return Response({'error': 'algorithm must be "greedy" or "graph".'}, status=status.HTTP_400_BAD_REQUEST)

    fn = run_greedy if algorithm == 'greedy' else run_graph
    result = fn(count, skill_std=skill_std)

    sim = SimulationResult.objects.create(
        algorithm=algorithm, player_count=count,
        matches_made=result['matches_made'],
        avg_skill_gap=result['avg_skill_gap'],
        avg_wait_time=result['avg_wait_time'],
        min_skill_gap=result['min_skill_gap'],
        max_skill_gap=result['max_skill_gap'],
        execution_time_ms=result['execution_time_ms'],
        fairness_score=result.get('fairness_score', 0),
        skill_gap_distribution=result['skill_gap_distribution'],
    )
    result['simulation_id'] = sim.id
    return Response(result)


@api_view(['POST'])
def simulate_compare(request):
    count     = request.data.get('player_count', 200)
    skill_std = request.data.get('skill_std', 400)
    try:
        count     = max(10, min(1000, int(count)))
        skill_std = max(50, min(800, int(skill_std)))
    except (ValueError, TypeError):
        count, skill_std = 200, 400

    greedy = run_greedy(count, skill_std=skill_std)
    graph  = run_graph(count, skill_std=skill_std)

    return Response({
        'greedy': greedy, 'graph': graph,
        'comparison': {
            'skill_gap_winner':  'graph'  if graph['avg_skill_gap']      < greedy['avg_skill_gap']      else 'greedy',
            'speed_winner':      'greedy' if greedy['execution_time_ms'] < graph['execution_time_ms']   else 'graph',
            'match_rate_winner': 'graph'  if graph['match_rate']         > greedy['match_rate']         else 'greedy',
            'fairness_winner':   'graph'  if graph.get('fairness_score', 0) > greedy.get('fairness_score', 0) else 'greedy',
        }
    })


@api_view(['GET'])
def simulation_history(request):
    sims = SimulationResult.objects.order_by('-created_at')[:20]
    data = [{
        'id': s.id, 'algorithm': s.algorithm,
        'player_count': s.player_count, 'matches_made': s.matches_made,
        'avg_skill_gap': s.avg_skill_gap, 'avg_wait_time': s.avg_wait_time,
        'execution_time_ms': s.execution_time_ms,
        'fairness_score': s.fairness_score,
        'match_rate': round((s.matches_made * 2 / s.player_count) * 100, 1) if s.player_count else 0,
        'created_at': s.created_at.isoformat(),
    } for s in sims]
    return Response({'results': data})
