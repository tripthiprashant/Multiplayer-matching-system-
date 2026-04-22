import { Swords, Clock, Globe, Zap, Star } from 'lucide-react'

function QualityBar({ quality }) {
  const color = quality >= 80 ? 'var(--success)' : quality >= 50 ? 'var(--warning)' : 'var(--error)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match Quality</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{Math.round(quality)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${quality}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
    </div>
  )
}

function MiniPlayer({ player, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{
        width: 48, height: 48, borderRadius: 14, margin: '0 auto 8px',
        background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)'
      }}>
        {player?.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{player?.name ?? 'Unknown'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>ELO {player?.elo ?? player?.skill ?? '—'}</div>
    </div>
  )
}

export default function MatchCard({ match }) {
  if (!match) return null

  const { player1, player2, skill_gap, match_quality, avg_wait_time, region, game_mode, created_at } = match

  const timeAgo = created_at ? (() => {
    const diff = Math.round((Date.now() - new Date(created_at).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`
    return `${Math.round(diff / 3600)}h ago`
  })() : null

  return (
    <div className="card card-glow" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords size={16} color="var(--primary-light)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Match Found!</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {region && <span className="badge badge-primary"><Globe size={10} />{region}</span>}
          {game_mode && <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}>{game_mode}</span>}
          {timeAgo && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{timeAgo}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <MiniPlayer player={player1} label="Player 1" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(99,102,241,0.15)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Swords size={16} color="var(--primary-light)" />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>VS</span>
        </div>
        <MiniPlayer player={player2} label="Player 2" />
      </div>

      {match_quality !== undefined && (
        <div style={{ marginBottom: 16 }}>
          <QualityBar quality={match_quality} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: <Zap size={12} />, label: 'Skill Gap', value: skill_gap ?? '—' },
          { icon: <Clock size={12} />, label: 'Avg Wait', value: avg_wait_time != null ? `${Math.round(avg_wait_time)}s` : '—' },
          { icon: <Star size={12} />, label: 'Quality', value: match_quality != null ? `${Math.round(match_quality)}%` : '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-3)', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>{icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
