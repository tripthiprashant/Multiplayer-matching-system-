import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getMatch, leaveQueue, postMatchResult } from '../services/api'
import { useApp } from '../context/AppContext'
import TierBadge from '../components/TierBadge'
import { Swords, RefreshCw, Home, Trophy } from 'lucide-react'

function WinProbBar({ prob = 50 }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-3)' }}>
        <span>Your Win Chance</span>
        <span style={{ fontWeight: 700, color: prob >= 50 ? 'var(--success)' : 'var(--warning)' }}>{prob}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-3)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${prob}%`, background: prob >= 50 ? 'var(--success)' : 'var(--warning)', transition: 'width 0.8s ease', borderRadius: '4px 0 0 4px' }} />
        <div style={{ flex: 1, background: 'rgba(239,68,68,0.35)', borderRadius: '0 4px 4px 0' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
        <span>You</span><span>Opponent</span>
      </div>
    </div>
  )
}

function VSPlayer({ player, label, isYou }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</div>
      <div style={{
        width: 64, height: 64, borderRadius: 18, margin: '0 auto 10px',
        background: isYou ? 'linear-gradient(135deg, var(--primary), #8B5CF6)' : 'linear-gradient(135deg, #EF4444, #F97316)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)',
        boxShadow: isYou ? '0 0 20px var(--primary-glow)' : '0 0 20px rgba(239,68,68,0.3)',
      }}>
        {player?.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{player?.name ?? 'Unknown'}</div>
      <TierBadge tier={player?.tier ?? 'Bronze'} />
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>ELO {player?.elo ?? '—'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{player?.wins ?? 0}W / {player?.losses ?? 0}L</div>
    </div>
  )
}

export default function Match() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const { player, clearPlayer } = useApp()
  const [match, setMatch]         = useState(state?.match ?? null)
  const [loading, setLoading]     = useState(!state?.match && !!player?.session_id)
  const [error, setError]         = useState(null)
  const [resultSent, setResultSent] = useState(false)
  const [eloChanges, setEloChanges] = useState(null)

  useEffect(() => {
    if (!match && player?.session_id) {
      setLoading(true)
      getMatch(player.session_id)
        .then(r => setMatch(r.data))
        .catch(() => setError('No match found yet. Go back to the queue.'))
        .finally(() => setLoading(false))
    }
  }, [])

  const handleResult = async (winnerId) => {
    if (!match?.match_id || resultSent) return
    try {
      const res = await postMatchResult({ match_id: match.match_id, winner_id: winnerId })
      setResultSent(true)
      setEloChanges(res.data.elo_changes)
    } catch (e) {
      setError('Could not record result.')
    }
  }

  const handlePlayAgain = async () => {
    if (player?.session_id) { try { await leaveQueue(player.session_id) } catch (_) {} }
    clearPlayer(); navigate('/join')
  }

  const handleHome = async () => {
    if (player?.session_id) { try { await leaveQueue(player.session_id) } catch (_) {} }
    clearPlayer(); navigate('/')
  }

  if (loading) return (
    <div className="page">
      <div className="container page-content" style={{ textAlign: 'center' }}>
        <div className="spin" style={{ width: 48, height: 48, border: '3px solid var(--border-2)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 20px' }} />
        <p style={{ color: 'var(--text-2)' }}>Loading match details…</p>
      </div>
    </div>
  )

  if (error || !match) return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
        <h2 style={{ marginBottom: 12 }}>{error ?? 'No match yet'}</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>
          {player ? "Your match hasn't been found yet." : 'Join the queue to get matched!'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => navigate(player ? '/queue' : '/join')} className="btn btn-primary">
            <Swords size={16} />{player ? 'Back to Queue' : 'Join Queue'}
          </button>
          <button onClick={() => navigate('/')} className="btn btn-ghost"><Home size={16} />Home</button>
        </div>
      </div>
    </div>
  )

  const you      = match.you      ?? match.player1
  const opponent = match.opponent ?? match.player2
  const winProb  = match.win_probability ?? 50

  return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🎮</div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Match Found!</h1>
          <p style={{ color: 'var(--text-2)' }}>Get ready — your opponent is waiting</p>
        </div>

        {/* VS Card */}
        <div className="card card-glow animate-in" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <VSPlayer player={you}      label="You"      isYou={true} />
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div className="vs-divider">VS</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Skill Gap: {match.skill_gap ?? '—'}</div>
            </div>
            <VSPlayer player={opponent} label="Opponent" isYou={false} />
          </div>
          <WinProbBar prob={winProb} />
        </div>

        {/* Match quality + stats */}
        <div className="card animate-in" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Trophy size={14} color="var(--warning)" />
            <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Match Info</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Quality',   value: match.match_quality != null ? `${Math.round(match.match_quality)}%` : '—' },
              { label: 'Avg Wait',  value: match.avg_wait_time != null ? `${Math.round(match.avg_wait_time)}s` : '—' },
              { label: 'Match ID',  value: match.match_id ? `#${match.match_id}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Record result */}
        {!resultSent && match.match_id && (
          <div className="card animate-in" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, fontWeight: 600 }}>Who won?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {you?.id && (
                <button onClick={() => handleResult(you.id)} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                  🏆 I Won
                </button>
              )}
              {opponent?.id && (
                <button onClick={() => handleResult(opponent.id)} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                  😔 I Lost
                </button>
              )}
            </div>
          </div>
        )}

        {/* ELO changes */}
        {eloChanges && (
          <div className="card animate-in" style={{ padding: 20, marginBottom: 16, border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>✅ Result Recorded — ELO Updated</div>
            {Object.entries(eloChanges).map(([name, data]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-2)' }}>
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{data.before} → <strong style={{ color: 'var(--text)' }}>{data.after}</strong></span>
                <span style={{ fontWeight: 700, color: data.delta >= 0 ? 'var(--success)' : 'var(--error)', fontSize: 14 }}>
                  {data.delta >= 0 ? '+' : ''}{data.delta}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="animate-in" style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePlayAgain} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 15, padding: 14 }}>
            <RefreshCw size={16} />Play Again
          </button>
          <button onClick={handleHome} className="btn btn-ghost" style={{ padding: '14px 20px' }}>
            <Home size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
