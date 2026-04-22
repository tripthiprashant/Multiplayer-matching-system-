const TIER_MAP = {
  Bronze:   { emoji: '🥉', cls: 'tier-bronze' },
  Silver:   { emoji: '🥈', cls: 'tier-silver' },
  Gold:     { emoji: '🥇', cls: 'tier-gold' },
  Platinum: { emoji: '💠', cls: 'tier-platinum' },
  Diamond:  { emoji: '💎', cls: 'tier-diamond' },
  Master:   { emoji: '👑', cls: 'tier-master' },
}

export default function TierBadge({ tier, size = 'sm' }) {
  const t = TIER_MAP[tier] ?? TIER_MAP['Bronze']
  const pad = size === 'lg' ? '6px 14px' : '3px 10px'
  const fs  = size === 'lg' ? 14 : 12
  return (
    <span className={`badge ${t.cls}`} style={{ padding: pad, fontSize: fs }}>
      {t.emoji} {tier}
    </span>
  )
}
