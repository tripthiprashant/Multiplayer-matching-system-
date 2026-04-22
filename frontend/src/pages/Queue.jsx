import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useQueue } from '../hooks/useQueue'
import PlayerCard from '../components/PlayerCard'
import { getLobbyStats, leaveQueue } from '../services/api'
import { Users, Wifi, WifiOff, ArrowRight, LogOut, Target } from 'lucide-react'

function PulsingDot() {
  return (
    <div style={{ position: 'relative', width: 14, height: 14 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'var(--success)', opacity: 0.5,
        animation: 'pulse-ring 1.5s ease-out infinite',
      }} />
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--success)' }} />
    </div>
  )
}

function SkillRangeBar({ base = 100, current = 100, max = 700 }) {
  const pct = Math.min(100, ((current - base) / (max - base)) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skill Range Expanding</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>±{current}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{
          width: `${Math.max(4, pct)}%`,
          background: 'linear-gradient(90deg, var(--primary), #C084FC)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
        <span>±{base}</span><span>±{max}</span>
      </div>
    </div>
  )
}

export default function Queue() {
  const navigate = useNavigate()
  const { player, clearPlayer } = useApp()
  const [stats, setStats]           = useState(null)
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [leaving, setLeaving]       = useState(false)

  const onMatched = useCallback((matchData) => {
    navigate('/match', { state: { match: matchData } })
  }, [navigate])

  const { status, error } = useQueue(player?.session_id, onMatched)

  useEffect(() => {
    const t = setInterval(() => setWaitSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    getLobbyStats().then(r => setStats(r.data)).catch(() => {})
    const t = setInterval(() => getLobbyStats().then(r => setStats(r.data)).catch(() => {}), 5000)
    return () => clearInterval(t)
  }, [])

  const handleLeave = async () => {
    setLeaving(true)
    try { await leaveQueue(player.session_id) } catch (_) {}
    clearPlayer(); navigate('/')
  }

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const serverWait  = status?.wait_seconds ?? waitSeconds
  const skillRange  = status?.current_skill_range ?? 100
  const queuePos    = status?.queue_position ?? '—'
  const estWait     = status?.estimated_wait_time

  return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 680 }}>

        {/* Status header */}
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {error ? <WifiOff size={40} color="var(--error)" /> : <PulsingDot />}
          </div>
          <h1 style={{ fontSize: 30, marginBottom: 8 }}>
            {error ? 'Connection Issue' : 'Finding Best Match…'}
          </h1>
          <p style={{ color: 'var(--text-2)' }}>
            {error ?? 'Our algorithm is scanning for the fairest opponent'}
          </p>
        </div>

        {/* Big timer */}
        <div className="card card-glow animate-in" style={{ padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Wait Time</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, var(--primary-light), #C084FC)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {fmt(serverWait)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Queue Position', value: `#${queuePos}` },
              { label: 'Est. Wait',      value: estWait ? `~${estWait}s` : '—' },
              { label: 'In Queue',       value: stats?.queuing_players ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill range bar */}
        <div className="card animate-in" style={{ padding: 20, marginBottom: 16 }}>
          <SkillRangeBar current={skillRange} />
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={12} color="var(--primary-light)" />
            Range expands +3 per second to find a match faster
          </div>
        </div>

        {/* Player card */}
        {player && (
          <div className="animate-in" style={{ marginBottom: 16 }}>
            <PlayerCard player={player} />
          </div>
        )}

        {/* Lobby stats */}
        {stats && (
          <div className="card animate-in" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Users size={14} color="var(--text-3)" />
              <span style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Live Lobby</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Queuing',       value: stats.queuing_players ?? 0 },
                { label: 'Matched',       value: stats.matched_players ?? 0 },
                { label: 'Total Matches', value: stats.total_matches ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--primary-light)' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleLeave} disabled={leaving} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
            <LogOut size={16} />{leaving ? 'Leaving…' : 'Leave Queue'}
          </button>
          <button onClick={() => navigate('/match', { state: {} })} className="btn btn-ghost" style={{ padding: '12px 16px' }}>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
