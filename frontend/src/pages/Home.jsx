import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { getLobbyStats, getLeaderboard } from '../services/api'
import { Swords, Users, Trophy, Zap, Globe, BarChart2, ArrowRight, Star, Clock, ChevronRight } from 'lucide-react'
import TierBadge from '../components/TierBadge'

// Count-up hook
function useCountUp(target, duration = 1000) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const diff  = target - start
    if (diff === 0) return
    const steps = 30
    let i = 0
    const t = setInterval(() => {
      i++
      setVal(Math.round(start + diff * (i / steps)))
      if (i >= steps) { clearInterval(t); prev.current = target }
    }, duration / steps)
    return () => clearInterval(t)
  }, [target, duration])
  return val
}

function StatCard({ icon, label, value, color = 'var(--primary-light)', suffix = '' }) {
  const num = useCountUp(typeof value === 'number' ? value : 0)
  return (
    <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>{icon}</div>
      <div>
        <div className="count-up" style={{ fontSize: 26 }}>
          {typeof value === 'number' ? num : value}{suffix}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      </div>
    </div>
  )
}

const STEPS = [
  { icon: '🎮', step: '01', title: 'Join the Queue', desc: 'Enter your name, skill rating, region and game mode.' },
  { icon: '⚡', step: '02', title: 'Smart Matching', desc: 'Our algorithm finds the fairest opponent in real time.' },
  { icon: '⚔️', step: '03', title: 'Play & Rank Up', desc: 'Win to gain ELO. Climb the leaderboard.' },
]

export default function Home() {
  const [stats, setStats]           = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    getLobbyStats().then(r => setStats(r.data)).catch(() => {})
    getLeaderboard().then(r => setLeaderboard(r.data?.leaderboard?.slice(0, 5) ?? [])).catch(() => {})
    const t = setInterval(() => getLobbyStats().then(r => setStats(r.data)).catch(() => {}), 5000)
    return () => clearInterval(t)
  }, [])

  const features = [
    { icon: <Zap size={20} />,      title: 'Skill-Based Matching',    desc: 'Dynamically expanding ELO range ensures fair matches even during off-peak hours.' },
    { icon: <Globe size={20} />,    title: 'Region & Mode Filters',   desc: 'Match players in the same region and game mode for the best experience.' },
    { icon: <BarChart2 size={20} />, title: 'Algorithm Simulation',   desc: 'Compare Greedy vs Graph algorithms on 10–1000 simulated players with fairness scores.' },
    { icon: <Trophy size={20} />,   title: 'Live ELO Leaderboard',    desc: 'ELO updates after every match. Climb from Bronze to Master.' },
  ]

  return (
    <div className="page">
      {/* ── Hero ── */}
      <section style={{
        minHeight: '65vh', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 70%)',
        borderBottom: '1px solid var(--border-2)',
      }}>
        <div className="container" style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
          <div className="animate-in" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--primary-light)', fontWeight: 600, marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            {stats ? `${stats.queuing_players ?? 0} players in queue right now` : 'Live matchmaking platform'}
          </div>

          <h1 className="animate-in" style={{ fontSize: 'clamp(36px, 6vw, 72px)', marginBottom: 16, lineHeight: 1.1 }}>
            Fair Matches.{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--primary-light), #C084FC)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Zero Wait.
            </span>
          </h1>

          <p className="animate-in" style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Real-time skill-based matchmaking with Greedy &amp; Graph algorithms, live ELO ranking, and a full simulation dashboard.
          </p>

          <div className="animate-in" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" className="btn btn-primary glow-anim" style={{ fontSize: 16, padding: '14px 32px' }}>
              <Swords size={18} />Enter Queue
            </Link>
            <Link to="/leaderboard" className="btn btn-ghost" style={{ fontSize: 16, padding: '14px 32px' }}>
              <Trophy size={18} />Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Live stats ── */}
        <section style={{ padding: '48px 0 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <StatCard icon={<Users size={20} />}    label="In Queue"      value={stats?.queuing_players ?? 0}  color="var(--primary-light)" />
            <StatCard icon={<Swords size={20} />}   label="Total Matches" value={stats?.total_matches ?? 0}    color="var(--success)" />
            <StatCard icon={<Trophy size={20} />}   label="Active Players" value={stats?.total_players ?? 0}   color="var(--warning)" />
            <StatCard icon={<Star size={20} />}     label="Avg Quality"   value={stats?.avg_match_quality ?? 0} color="var(--primary-light)" suffix="%" />
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: '56px 0' }}>
          <h2 style={{ fontSize: 26, marginBottom: 32, textAlign: 'center' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {STEPS.map(({ icon, step, title, desc }, i) => (
              <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(99,102,241,0.12)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>STEP {step}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={16} color="var(--border)" style={{ flexShrink: 0, marginTop: 14, display: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ paddingBottom: 56 }}>
          <h2 style={{ fontSize: 26, marginBottom: 32, textAlign: 'center' }}>Platform Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                  background: 'rgba(99,102,241,0.12)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-light)',
                }}>{icon}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Leaderboard preview ── */}
        {leaderboard.length > 0 ? (
          <section style={{ paddingBottom: 64 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22 }}>Top Players</h2>
              <Link to="/leaderboard" style={{ fontSize: 13, color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                Full Leaderboard <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {leaderboard.map((p, i) => (
                <div key={p.id ?? i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                  borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border-2)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(148,163,184,0.15)' : 'rgba(180,83,9,0.15)',
                    color: i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-2)' : '#cd7c2f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)',
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.region} · {p.game_mode}</div>
                  </div>
                  <TierBadge tier={p.tier} />
                  <div style={{ textAlign: 'right', minWidth: 48 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'var(--font-display)' }}>{p.elo}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ELO</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section style={{ paddingBottom: 64, textAlign: 'center' }}>
            <div className="card" style={{ padding: '48px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👀</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Looks quiet here…</div>
              <div style={{ color: 'var(--text-2)', marginBottom: 20 }}>No players yet. Be the first to join and claim the #1 spot!</div>
              <Link to="/join" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                <Swords size={16} />Join Now
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
