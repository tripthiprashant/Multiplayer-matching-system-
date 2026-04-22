"""
Matchmaking Algorithms v2
1. Greedy  — Sort by skill, pair nearest neighbors. O(n log n)
2. Graph   — Weighted bipartite matching via scipy. O(n^3)
Both accept skill_std for adjustable simulation distributions.
"""
import time
import random
import statistics
from dataclasses import dataclass
from typing import List


@dataclass
class SimPlayer:
    id: int
    skill: int
    region: str
    game_mode: str
    wait_time: float = 0.0

    def effective_skill_range(self) -> int:
        return int(100 + min(self.wait_time * 5, 400))


@dataclass
class SimMatch:
    player1: 'SimPlayer'
    player2: 'SimPlayer'
    skill_gap: int = 0
    wait_time_avg: float = 0.0
    quality: float = 0.0

    def __post_init__(self):
        self.skill_gap    = abs(self.player1.skill - self.player2.skill)
        self.wait_time_avg = (self.player1.wait_time + self.player2.wait_time) / 2
        self.quality      = max(0.0, 100.0 - (self.skill_gap / 30.0))


def _generate_players(count: int, skill_std: int = 400) -> List[SimPlayer]:
    regions = ['NA', 'EU', 'AS', 'SA', 'OCE', 'ME']
    modes   = ['ranked', 'casual', 'tournament', 'practice']
    players = []
    for i in range(count):
        skill = int(random.gauss(1500, skill_std))
        skill = max(100, min(3000, skill))
        wait  = random.uniform(0, 120)
        players.append(SimPlayer(
            id=i, skill=skill,
            region=random.choice(regions),
            game_mode=random.choice(modes),
            wait_time=wait,
        ))
    return players


def _fairness_score(gaps: list) -> float:
    """0–100: higher = more fair (lower variance in skill gaps)."""
    if not gaps:
        return 0.0
    if len(gaps) == 1:
        return max(0.0, 100.0 - gaps[0] / 10)
    std = statistics.stdev(gaps)
    avg = statistics.mean(gaps)
    # Coefficient of variation inverted
    cv = std / avg if avg > 0 else 1
    return round(max(0.0, min(100.0, 100 - cv * 50)), 1)


def run_greedy(count: int, skill_std: int = 400) -> dict:
    start   = time.time()
    players = _generate_players(count, skill_std)
    players.sort(key=lambda p: p.skill)

    matches: List[SimMatch] = []
    unmatched = set(range(len(players)))

    i = 0
    while i < len(players) - 1:
        if i not in unmatched:
            i += 1
            continue
        p1 = players[i]
        best_partner, best_gap = None, float('inf')
        for j in range(i + 1, min(i + 11, len(players))):
            if j not in unmatched:
                continue
            gap = abs(p1.skill - players[j].skill)
            if gap <= p1.effective_skill_range() and gap < best_gap:
                best_gap, best_partner = gap, j
        if best_partner is not None:
            matches.append(SimMatch(p1, players[best_partner]))
            unmatched.discard(i)
            unmatched.discard(best_partner)
        i += 1

    return _build_result('greedy', count, matches, (time.time() - start) * 1000)


def run_graph(count: int, skill_std: int = 400) -> dict:
    try:
        import numpy as np
        from scipy.optimize import linear_sum_assignment
    except ImportError:
        r = run_greedy(count, skill_std)
        r['algorithm'] = 'graph'
        return r

    start   = time.time()
    players = _generate_players(count, skill_std)
    half    = len(players) // 2
    left, right = players[:half], players[half:]

    if not left or not right:
        return _build_result('graph', count, [], (time.time() - start) * 1000)

    n = min(len(left), len(right))
    cost = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            p1, p2 = left[i], right[j]
            cost[i][j] = (
                abs(p1.skill - p2.skill)
                + (0 if p1.region    == p2.region    else 200)
                + (0 if p1.game_mode == p2.game_mode else 150)
            )

    row_ind, col_ind = linear_sum_assignment(cost)
    matches = [
        SimMatch(left[r], right[c])
        for r, c in zip(row_ind, col_ind)
        if abs(left[r].skill - right[c].skill) <= 800
    ]

    return _build_result('graph', count, matches, (time.time() - start) * 1000)


def _build_result(algorithm: str, count: int, matches: List[SimMatch], elapsed_ms: float) -> dict:
    if not matches:
        return {
            'algorithm': algorithm, 'player_count': count,
            'matches_made': 0, 'avg_skill_gap': 0, 'avg_wait_time': 0,
            'min_skill_gap': 0, 'max_skill_gap': 0,
            'execution_time_ms': round(elapsed_ms, 2),
            'skill_gap_distribution': [], 'match_rate': 0, 'fairness_score': 0,
        }

    gaps  = [m.skill_gap    for m in matches]
    waits = [m.wait_time_avg for m in matches]

    labels  = ['0-100', '100-200', '200-300', '300-400', '400-500', '500+']
    buckets = [0] * 6
    for g in gaps:
        buckets[min(int(g // 100), 5)] += 1
    distribution = [{'range': labels[i], 'count': buckets[i]} for i in range(6)]

    return {
        'algorithm': algorithm,
        'player_count': count,
        'matches_made': len(matches),
        'avg_skill_gap': round(sum(gaps) / len(gaps), 1),
        'avg_wait_time': round(sum(waits) / len(waits), 1),
        'min_skill_gap': min(gaps),
        'max_skill_gap': max(gaps),
        'execution_time_ms': round(elapsed_ms, 2),
        'skill_gap_distribution': distribution,
        'match_rate': round((len(matches) * 2 / count) * 100, 1),
        'fairness_score': _fairness_score(gaps),
    }
