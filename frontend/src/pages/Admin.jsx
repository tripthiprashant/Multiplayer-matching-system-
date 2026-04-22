 import { useState, useEffect } from 'react'
import { simulate, simulateCompare, getLeaderboard, getLobbyStats, getSimulationHistory } from '../services/api'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { BarChart2, Play, Trophy, Zap, Users, RefreshCw, Clock, Star } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  }
}

function Section({ title, icon, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-light)'
        }}>{icon}</div>
        <h2 style={{ fontSize: 20 }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('simulate')
  const [simForm, setSimForm] = useState({ player_count: 200, algorithm: 'greedy', skill_std: 400 })
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)
  const [compareResult, setCompareResult] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    getLobbyStats().then(r => setStats(r.data)).catch(() => {})
    getLeaderboard().then(r => setLeaderboard(r.data?.leaderboard ?? [])).catch(() => {})
    getSimulationHistory().then(r => setHistory(r.data?.results ?? [])).catch(() => {})
  }, [])

  const runSim = async () => {
    setSimLoading(true); setSimError(null); setSimResult(null)
    try {
      const res = await simulate(simForm)
      setSimResult(res.data)
    } catch (e) {
      setSimError(e?.response?.data?.error ?? 'Simulation failed.')
    } finally { setSimLoading(false) }
  }

  const runCompare = async () => {
    setCompareLoading(true); setCompareResult(null)
    try {
      const res = await simulateCompare({ player_count: simForm.player_count, skill_std: simForm.skill_std })
      setCompareResult(res.data)
    } catch (e) {
      setSimError('Compare failed.')
    } finally { setCompareLoading(false) }
  }

  const tabs = ['simulate', 'leaderboard', 'stats']

  return (
    <div className="page">
      <div className="container page-content">
        {/* Header */}
        <div className="animate-in" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <BarChart2 size={28} color="var(--primary-light)" />
            <h1 style={{ fontSize: 30 }}>Admin Panel</h1>
          </div>
          <p style={{ color: 'var(--text-2)' }}>Simulation tools, leaderboard, and live lobby analytics.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'var(--card)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-2)',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>

        {/* SIMULATE TAB */}
        {tab === 'simulate' && (
          <div className="animate-in">
            <Section title="Run Simulation" icon={<Play size={16} />}>
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
                  <div>
                    <label className="label">Player Count ({simForm.player_count})</label>
                    <input type="range" min={10} max={1000} step={10} value={simForm.player_count}
                      onChange={e => setSimForm(f => ({ ...f, player_count: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'var(--primary)', marginTop: 8 }} />
                  </div>
                  <div>
                    <label className="label">Skill Spread ({simForm.skill_std})</label>
                    <input type="range" min={50} max={800} step={50} value={simForm.skill_std}
                      onChange={e => setSimForm(f => ({ ...f, skill_std: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'var(--primary)', marginTop: 8 }} />
                  </div>
                  <div>
                    <label className="label">Algorithm</label>
                    <select className="input-field" value={simForm.algorithm}
                      onChange={e => setSimForm(f => ({ ...f, algorithm: e.target.value }))}>
                      <option value="greedy">Greedy (Fast)</option>
                      <option value="graph">Graph (Optimal)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={runSim} disabled={simLoading} className="btn btn-primary">
                      {simLoading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
                      {simLoading ? 'Running…' : 'Run'}
                    </button>
                    <button onClick={runCompare} disabled={compareLoading} className="btn btn-ghost">
                      {compareLoading ? <RefreshCw size={16} className="spin" /> : <BarChart2 size={16} />}
                      Compare
                    </button>
                  </div>
                </div>
              </div>

              {simError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>
                  {simError}
                </div>
              )}

              {simResult && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Matches Made', value: simResult.matches_made, icon: <Zap size={14} /> },
                      { label: 'Avg Skill Gap', value: Math.round(simResult.avg_skill_gap), icon: <Star size={14} /> },
                      { label: 'Avg Wait (s)', value: Math.round(simResult.avg_wait_time), icon: <Clock size={14} /> },
                      { label: 'Exec Time', value: `${simResult.execution_time_ms?.toFixed(1)}ms`, icon: <Play size={14} /> },
                      { label: 'Fairness Score', value: `${simResult.fairness_score ?? 0}%`, icon: <Star size={14} /> },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="card" style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'var(--primary-light)', marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {simResult.skill_gap_distribution?.length > 0 && (
                    <div className="card" style={{ padding: 24, height: 280 }}>
                      <Bar
                        data={{
                          labels: simResult.skill_gap_distribution.map(d => d.range),
                          datasets: [{
                            label: 'Matches per Skill Gap Range',
                            data: simResult.skill_gap_distribution.map(d => d.count),
                            backgroundColor: 'rgba(99,102,241,0.6)',
                            borderColor: 'rgba(99,102,241,1)',
                            borderWidth: 1,
                          }]
                        }}
                        options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, title: { display: true, text: 'Skill Gap Distribution', color: '#94A3B8' } } }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Compare result */}
              {compareResult && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16 }}>Algorithm Comparison</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {['greedy', 'graph'].map(alg => {
                      const d = compareResult[alg]
                      if (!d) return null
                      return (
                        <div key={alg} className="card" style={{ padding: 20 }}>
                          <div style={{ fontWeight: 700, marginBottom: 12, textTransform: 'capitalize', color: alg === 'greedy' ? 'var(--success)' : 'var(--primary-light)' }}>{alg}</div>
                          {[
                            ['Matches', d.matches_made],
                            ['Avg Gap', Math.round(d.avg_skill_gap)],
                            ['Exec Time', `${d.execution_time_ms?.toFixed(1)}ms`],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                              <span style={{ color: 'var(--text-2)' }}>{k}</span>
                              <span style={{ fontWeight: 700 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <div className="card" style={{ padding: 24, height: 280 }}>
                    <Bar
                      data={{
                        labels: ['Matches Made', 'Avg Skill Gap', 'Exec Time (ms)'],
                        datasets: [
                          {
                            label: 'Greedy',
                            data: [compareResult.greedy?.matches_made, compareResult.greedy?.avg_skill_gap, compareResult.greedy?.execution_time_ms],
                            backgroundColor: 'rgba(34,197,94,0.6)', borderColor: 'rgba(34,197,94,1)', borderWidth: 1
                          },
                          {
                            label: 'Graph',
                            data: [compareResult.graph?.matches_made, compareResult.graph?.avg_skill_gap, compareResult.graph?.execution_time_ms],
                            backgroundColor: 'rgba(99,102,241,0.6)', borderColor: 'rgba(99,102,241,1)', borderWidth: 1
                          }
                        ]
                      }}
                      options={CHART_OPTS}
                    />
                  </div>
                </div>
              )}
            </Section>

            {/* History */}
            {history.length > 0 && (
              <Section title="Simulation History" icon={<Clock size={16} />}>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {history.slice(0, 10).map((s, i) => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                      borderBottom: i < Math.min(history.length, 10) - 1 ? '1px solid var(--border-2)' : 'none'
                    }}>
                      <span className={`badge ${s.algorithm === 'greedy' ? 'badge-success' : 'badge-primary'}`} style={{ minWidth: 60, justifyContent: 'center' }}>
                        {s.algorithm}
                      </span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)' }}>
                        {s.player_count} players → {s.matches_made} matches
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        Gap: {Math.round(s.avg_skill_gap)} · {s.execution_time_ms?.toFixed(1)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {tab === 'leaderboard' && (
          <div className="animate-in">
            <Section title="ELO Leaderboard" icon={<Trophy size={16} />}>
              {leaderboard.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
                  No players yet. Join the queue to appear here!
                </div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                  {leaderboard.map((p, i) => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                      borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border-2)' : 'none',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(148,163,184,0.15)' : i === 2 ? 'rgba(180,83,9,0.15)' : 'var(--bg-3)',
                        color: i === 0 ? 'var(--warning)' : i === 1 ? '#CBD5E1' : i === 2 ? '#cd7c2f' : 'var(--text-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)'
                      }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {p.region} · {p.game_mode} · W{p.wins}/L{p.losses}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'var(--font-display)', fontSize: 18 }}>{p.elo}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.win_rate ?? 0}% WR</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div className="animate-in">
            <Section title="Live Lobby Stats" icon={<Users size={16} />}>
              {stats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  {[
                    { label: 'Players in Queue', value: stats.queuing_players ?? 0, color: 'var(--primary-light)' },
                    { label: 'Matched Players', value: stats.matched_players ?? 0, color: 'var(--success)' },
                    { label: 'Total Players', value: stats.total_players ?? 0, color: 'var(--warning)' },
                    { label: 'Total Matches', value: stats.total_matches ?? 0, color: 'var(--primary-light)' },
                    { label: 'Avg Match Quality', value: stats.avg_match_quality ? `${Math.round(stats.avg_match_quality)}%` : '—', color: 'var(--success)' },
                    { label: 'Avg Skill Gap', value: stats.avg_skill_gap ? Math.round(stats.avg_skill_gap) : '—', color: 'var(--text-2)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="card" style={{ padding: '18px 20px' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{value}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-2)', textAlign: 'center', padding: 40 }}>Loading stats…</div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}