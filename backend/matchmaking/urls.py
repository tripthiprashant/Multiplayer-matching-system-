from django.urls import path
from . import views

urlpatterns = [
    path('join/',               views.join_queue,         name='join_queue'),
    path('leave/',              views.leave_queue,         name='leave_queue'),
    path('status/',             views.player_status,       name='player_status'),
    path('match/',              views.find_match,          name='find_match'),
    path('match/result/',       views.match_result,        name='match_result'),
    path('history/',            views.match_history,       name='match_history'),
    path('stats/',              views.lobby_stats,         name='lobby_stats'),
    path('simulate/',           views.simulate,            name='simulate'),
    path('simulate/compare/',   views.simulate_compare,    name='simulate_compare'),
    path('leaderboard/',        views.leaderboard,         name='leaderboard'),
    path('simulations/',        views.simulation_history,  name='simulation_history'),
]
