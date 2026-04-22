import { useState, useEffect } from 'react'
import { getLeaderboard } from '../services/api'
import TierBadge from '../components/TierBadge'
import { Trophy, RefreshCw } from 'lucide-react'

const REGIONS   = ['', 'NA', 'EU', 'AS', 'SA', 'OCE', 'ME']
const MODES     = ['', 'ranked', 'casual', 'tournament', 'practice']
const FLAG      = { NA: '🇺🇸', EU: '🇪🇺', AS: '🌏', SA: '🇧🇷', OCE: '🇦🇺', ME: '🌍' }
const RANK_STYLE = [
  { bg: 'rgba(245,158,11,0.2)', color: 'var(--warning)' },
  { bg: 'rgba(148,163,184,0.15)', color: '#CBD5E1' },
  { bg: 'rgba(180,83,9,0.15)',  color: '#cd7c2f' },
]

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border-2)' }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 99 }} />
      <div className="skeleton" style={{ width: 48, height: 20 }} />
    </div>
  )
}

export default function Leaderboard() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion]   = useState('')
  const [mode, setMode]       = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (region) params.region = region
    if (mode)   params.mode   = mode
    getLeaderboard(params)
      .then(r => setData(r.data?.leaderboard ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [region, mode])

  const selStyle = (active) => ({
    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid var(--primary)' : '1px solid var(--border-2)',
    background: active ? 'rgba(99,102,241,0.15)' : 'var(--bg-3)',
    color: active ? 'var(--primary-light)' : 'var(--text-2)',
    transition: 'all 0.15s',
  })

  return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 800 }}>

        {/* Header */}
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color="var(--warning)" />
          </div>
          <div>
            <h1 style={{ fontSize: 28 }}>Leaderboard</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Top players ranked by ELO</p>
          </div>
          <button onClick={load} className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '8px 12px' }}>
            <RefreshCw size={14} />Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="animate-in" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Region</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)} style={selStyle(region === r)}>
                {r ? `${FLAG[r]} ${r}` : 'All Regions'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Mode</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MODES.map(m => (
              <button key={m} onClick={() => setMode(m)} style={selStyle(mode === m)}>
                {m || 'All Modes'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card animate-in" style={{ overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 80px 80px 70px', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border-2)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>#</span><span>Player</span><span>Tier</span><span style={{ textAlign: 'right' }}>ELO</span><span style={{ textAlign: 'right' }}>W/L</span><span style={{ textAlign: 'right' }}>WR%</span>
          </div>

          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : data.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>👀</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No players found</div>
              <div style={{ color: 'var(--text-2)' }}>Try a different filter, or invite friends to play!</div>
            </div>
          ) : (
            data.map((p, i) => {
              const rs = RANK_STYLE[i] ?? { bg: 'var(--bg-3)', color: 'var(--text-3)' }
              return (
                <div key={p.id ?? i} style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr 100px 80px 80px 70px',
                  gap: 8, alignItems: 'center', padding: '13px 20px',
                  borderBottom: i < data.length - 1 ? '1px solid var(--border-2)' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{FLAG[p.region]} {p.region} · {p.game_mode}</div>
                  </div>
                  <div><TierBadge tier={p.tier} /></div>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'var(--font-display)', fontSize: 16 }}>{p.elo}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-2)' }}>{p.wins}W/{p.losses}L</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: p.win_rate >= 50 ? 'var(--success)' : 'var(--text-2)' }}>{p.win_rate}%</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
