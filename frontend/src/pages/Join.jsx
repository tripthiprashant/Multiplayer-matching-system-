 import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinQueue } from '../services/api'
import { useApp } from '../context/AppContext'
import { Swords, User, Globe, Gamepad2, Zap } from 'lucide-react'

const REGIONS = ['NA', 'EU', 'AS', 'SA', 'OCE', 'ME']
const MODES = ['ranked', 'casual', 'tournament', 'practice']
const REGION_FLAGS = { NA: '🇺🇸', EU: '🇪🇺', AS: '🌏', SA: '🇧🇷', OCE: '🇦🇺', ME: '🌍' }

export default function Join() {
  const navigate = useNavigate()
  const { savePlayer } = useApp()

  const [form, setForm] = useState({ name: '', skill: 1200, region: 'NA', game_mode: 'ranked' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Please enter a player name.'); return }
    if (form.skill < 0 || form.skill > 3000) { setError('Skill must be 0–3000.'); return }
    setLoading(true); setError(null)
    try {
      const res = await joinQueue(form)
      savePlayer({ ...res.data, name: form.name, skill: form.skill, region: form.region, game_mode: form.game_mode })
      navigate('/queue')
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to join queue. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="animate-in" style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)'
            }}>
              <Swords size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 28 }}>Join the Queue</h1>
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 2 }}>Fill in your info to start matchmaking</p>
            </div>
          </div>
        </div>

        <div className="card card-glow animate-in" style={{ padding: 28 }}>
          {/* Player Name */}
          <div style={{ marginBottom: 20 }}>
            <label className="label"><User size={11} style={{ display: 'inline', marginRight: 4 }} />Player Name</label>
            <input
              className="input-field"
              placeholder="e.g. ShadowByte"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              maxLength={50}
            />
          </div>

          {/* Skill */}
          <div style={{ marginBottom: 20 }}>
            <label className="label"><Zap size={11} style={{ display: 'inline', marginRight: 4 }} />Skill Rating (0–3000)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="range" min={0} max={3000} step={50}
                value={form.skill}
                onChange={e => set('skill', Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--primary)' }}
              />
              <input
                type="number" min={0} max={3000}
                value={form.skill}
                onChange={e => set('skill', Number(e.target.value))}
                className="input-field"
                style={{ width: 80 }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
              {form.skill < 800 ? '🟤 Bronze' : form.skill < 1200 ? '⚪ Silver' : form.skill < 1600 ? '🟡 Gold' : form.skill < 2200 ? '🔵 Platinum' : form.skill < 2700 ? '💎 Diamond' : '👑 Master'}
            </div>
          </div>

          {/* Region */}
          <div style={{ marginBottom: 20 }}>
            <label className="label"><Globe size={11} style={{ display: 'inline', marginRight: 4 }} />Region</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => set('region', r)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: form.region === r ? '1px solid var(--primary)' : '1px solid var(--border-2)',
                    background: form.region === r ? 'rgba(99,102,241,0.15)' : 'var(--bg-3)',
                    color: form.region === r ? 'var(--primary-light)' : 'var(--text-2)',
                    transition: 'all 0.15s', cursor: 'pointer'
                  }}
                >
                  {REGION_FLAGS[r]} {r}
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode */}
          <div style={{ marginBottom: 28 }}>
            <label className="label"><Gamepad2 size={11} style={{ display: 'inline', marginRight: 4 }} />Game Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {MODES.map(m => (
                <button
                  key={m}
                  onClick={() => set('game_mode', m)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: form.game_mode === m ? '1px solid var(--primary)' : '1px solid var(--border-2)',
                    background: form.game_mode === m ? 'rgba(99,102,241,0.15)' : 'var(--bg-3)',
                    color: form.game_mode === m ? 'var(--primary-light)' : 'var(--text-2)',
                    transition: 'all 0.15s', cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--error)', fontSize: 13
            }}>{error}</div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px' }}
          >
            {loading ? <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> : <Swords size={18} />}
            {loading ? 'Joining…' : 'Enter Queue'}
          </button>
        </div>
      </div>
    </div>
  )
}