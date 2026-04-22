 import { User, Globe, Gamepad2, Star, Trophy, TrendingUp } from 'lucide-react'

const REGION_FLAGS = { NA: '🇺🇸', EU: '🇪🇺', AS: '🌏', SA: '🇧🇷', OCE: '🇦🇺', ME: '🌍' }
const MODE_COLORS = {
  ranked: 'var(--primary-light)',
  casual: 'var(--success)',
  tournament: 'var(--warning)',
  practice: 'var(--text-3)',
}

function SkillBar({ skill }) {
  const pct = Math.min(100, Math.round((skill / 3000) * 100))
  const color = skill < 1000 ? 'var(--text-3)' : skill < 1800 ? 'var(--success)' : skill < 2400 ? 'var(--warning)' : 'var(--primary-light)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skill Rating</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{skill}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function PlayerCard({ player, compact = false }) {
  if (!player) return null

  const winRate = player.win_rate ?? (
    (player.wins + player.losses) > 0
      ? Math.round((player.wins / (player.wins + player.losses)) * 100)
      : 0
  )

  if (compact) {
    return (
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <User size={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{player.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {REGION_FLAGS[player.region]} {player.region} · ELO {player.elo ?? player.skill}
          </div>
        </div>
        <span className="badge badge-primary" style={{ fontSize: 11 }}>
          {player.game_mode}
        </span>
      </div>
    )
  }

  return (
    <div className="card card-glow" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 16px var(--primary-glow)'
        }}>
          <User size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{player.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-primary">
              <Globe size={10} />
              {REGION_FLAGS[player.region]} {player.region}
            </span>
            <span className="badge" style={{
              background: 'rgba(255,255,255,0.06)',
              color: MODE_COLORS[player.game_mode] || 'var(--text-2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Gamepad2 size={10} />
              {player.game_mode}
            </span>
          </div>
        </div>
      </div>

      {/* Skill bar */}
      <div style={{ marginBottom: 20 }}>
        <SkillBar skill={player.skill ?? player.elo ?? 1200} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { icon: <Trophy size={14} />, label: 'ELO', value: player.elo ?? player.skill ?? 1200, color: 'var(--warning)' },
          { icon: <Star size={14} />, label: 'Win Rate', value: `${winRate}%`, color: 'var(--success)' },
          { icon: <TrendingUp size={14} />, label: 'W / L', value: `${player.wins ?? 0}/${player.losses ?? 0}`, color: 'var(--primary-light)' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px', textAlign: 'center'
          }}>
            <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}