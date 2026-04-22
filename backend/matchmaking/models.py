from django.db import models
from django.utils import timezone


def get_tier(elo: int) -> str:
    if elo < 800:   return 'Bronze'
    if elo < 1200:  return 'Silver'
    if elo < 1600:  return 'Gold'
    if elo < 2200:  return 'Platinum'
    if elo < 2700:  return 'Diamond'
    return 'Master'


class Player(models.Model):
    REGION_CHOICES = [
        ('NA', 'North America'), ('EU', 'Europe'), ('AS', 'Asia'),
        ('SA', 'South America'), ('OCE', 'Oceania'), ('ME', 'Middle East'),
    ]
    GAME_MODE_CHOICES = [
        ('ranked', 'Ranked'), ('casual', 'Casual'),
        ('tournament', 'Tournament'), ('practice', 'Practice'),
    ]
    STATUS_CHOICES = [
        ('queuing', 'In Queue'), ('matched', 'Matched'), ('left', 'Left Queue'),
    ]

    name       = models.CharField(max_length=100)
    skill      = models.IntegerField()
    region     = models.CharField(max_length=10, choices=REGION_CHOICES)
    game_mode  = models.CharField(max_length=20, choices=GAME_MODE_CHOICES)
    join_time  = models.DateTimeField(default=timezone.now)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queuing')
    elo        = models.IntegerField(default=1200)
    wins       = models.IntegerField(default=0)
    losses     = models.IntegerField(default=0)
    session_id = models.CharField(max_length=128, blank=True, null=True, unique=True)

    class Meta:
        ordering = ['join_time']

    def __str__(self):
        return f"{self.name} (ELO:{self.elo}, {self.region})"

    @property
    def wait_seconds(self):
        return int((timezone.now() - self.join_time).total_seconds())

    @property
    def win_rate(self):
        total = self.wins + self.losses
        return round((self.wins / total) * 100, 1) if total else 0.0

    @property
    def tier(self):
        return get_tier(self.elo)


class Match(models.Model):
    player1      = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, related_name='matches_as_p1')
    player2      = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, related_name='matches_as_p2')
    created_at   = models.DateTimeField(default=timezone.now)
    skill_gap    = models.IntegerField()
    region       = models.CharField(max_length=10, blank=True)
    game_mode    = models.CharField(max_length=20, blank=True)
    match_quality = models.FloatField(default=0.0)
    avg_wait_time = models.FloatField(default=0.0)
    winner       = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='wins_as_winner')
    result_recorded = models.BooleanField(default=False)

    # ELO snapshots at time of match
    p1_elo_before = models.IntegerField(default=0)
    p2_elo_before = models.IntegerField(default=0)
    p1_elo_after  = models.IntegerField(default=0)
    p2_elo_after  = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Match #{self.id}: {self.player1} vs {self.player2}"


class SimulationResult(models.Model):
    ALGORITHM_CHOICES = [('greedy', 'Greedy'), ('graph', 'Graph')]
    algorithm              = models.CharField(max_length=20, choices=ALGORITHM_CHOICES)
    player_count           = models.IntegerField()
    matches_made           = models.IntegerField()
    avg_skill_gap          = models.FloatField()
    avg_wait_time          = models.FloatField()
    min_skill_gap          = models.FloatField(default=0)
    max_skill_gap          = models.FloatField(default=0)
    execution_time_ms      = models.FloatField()
    fairness_score         = models.FloatField(default=0)
    created_at             = models.DateTimeField(default=timezone.now)
    skill_gap_distribution = models.JSONField(default=list)

    def __str__(self):
        return f"Sim [{self.algorithm}] {self.player_count} players -> {self.matches_made} matches"
