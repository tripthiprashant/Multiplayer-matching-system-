import { useState, useEffect } from 'react'
import { getMatchHistory } from '../services/api'
import { useApp } from '../context/AppContext'
import { Clock, Swords, TrendingUp, TrendingDown } from 'lucide-react'

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border-2)', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '40%', height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 20 }} />
    </div>
  )
}

function EloDelta({ before, after }) {
  if (!before || !after) return null
  const delta = after - before
  const color = delta >= 0 ? 'var(--success)' : 'var(--error)'
  const Icon  = delta >= 0 ? TrendingUp : TrendingDown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color }}>
      <Icon size={13} />{delta >= 0 ? '+' : ''}{delta}
    </span>
  )
}

export default function History() {
  const { player }        = useApp()
  const [data, setData]   = useState([])
  const [loading, setLoading] = useState(true)
  const [myOnly, setMyOnly]   = useState(false)

  useEffect(() => {
    setLoading(true)
    const sid = myOnly && player?.session_id ? player.session_id : undefined
    getMatchHistory(sid)
      .then(r => setData(r.data?.history ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [myOnly, player?.session_id])

  const timeAgo = (iso) => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`
    return `${Math.round(diff / 3600)}h ago`
  }

  return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 800 }}>

        {/* Header */}
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="var(--primary-light)" />
          </div>
          <div>
            <h1 style={{ fontSize: 28 }}>Match History</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Completed matches with ELO changes</p>
          </div>
          {player && (
            <button onClick={() => setMyOnly(o => !o)} className={`btn ${myOnly ? 'btn-primary' : 'btn-ghost'}`} style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 13 }}>
              {myOnly ? '👤 My Matches' : '🌐 All Matches'}
            </button>
          )}
        </div>

        <div className="card animate-in" style={{ overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 80px', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border-2)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Player 1</span><span>Player 2</span><span>Winner</span><span style={{ textAlign: 'right' }}>ELO Δ</span><span style={{ textAlign: 'right' }}>When</span>
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : data.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No match history yet</div>
              <div style={{ color: 'var(--text-2)' }}>Play a match and record the result to see it here.</div>
            </div>
          ) : (
            data.map((m, i) => {
              const p1IsWinner = m.winner_id === m.player1?.id
              return (
                <div key={m.match_id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 80px',
                  gap: 8, alignItems: 'center', padding: '13px 20px',
                  borderBottom: i < data.length - 1 ? '1px solid var(--border-2)' : 'none',
                }}>
                  {/* P1 */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: p1IsWinner ? 'var(--success)' : 'var(--text)' }}>
                      {p1IsWinner ? '🏆 ' : ''}{m.player1?.name ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>ELO {m.p1_elo_before} → {m.p1_elo_after}</div>
                  </div>
                  {/* P2 */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: !p1IsWinner ? 'var(--success)' : 'var(--text)' }}>
                      {!p1IsWinner ? '🏆 ' : ''}{m.player2?.name ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>ELO {m.p2_elo_before} → {m.p2_elo_after}</div>
                  </div>
                  {/* Winner */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{m.winner_name ?? '—'}</div>
                  {/* ELO delta for winner */}
                  <div style={{ textAlign: 'right' }}>
                    {p1IsWinner
                      ? <EloDelta before={m.p1_elo_before} after={m.p1_elo_after} />
                      : <EloDelta before={m.p2_elo_before} after={m.p2_elo_after} />}
                  </div>
                  {/* Time */}
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-3)' }}>{timeAgo(m.created_at)}</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
