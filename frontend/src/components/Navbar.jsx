import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { leaveQueue } from '../services/api'
import { Swords, BarChart2, Home, LogOut, User, Trophy, Clock, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/',            icon: <Home size={14} />,     label: 'Home' },
  { to: '/join',        icon: <Swords size={14} />,   label: 'Play' },
  { to: '/leaderboard', icon: <Trophy size={14} />,   label: 'Leaderboard' },
  { to: '/history',     icon: <Clock size={14} />,    label: 'History' },
  { to: '/admin',       icon: <BarChart2 size={14} />, label: 'Admin' },
]

export default function Navbar() {
  const { player, clearPlayer } = useApp()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [leaving, setLeaving]   = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLeave = async () => {
    if (!player?.session_id) return
    setLeaving(true)
    try { await leaveQueue(player.session_id) } catch (_) {}
    clearPlayer(); navigate('/'); setLeaving(false)
  }

  const isActive = (p) => location.pathname === p

  const linkStyle = (p) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    color: isActive(p) ? 'var(--primary-light)' : 'var(--text-2)',
    background: isActive(p) ? 'rgba(99,102,241,0.12)' : 'transparent',
    textDecoration: 'none', transition: 'all 0.15s',
  })

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-2)',
      padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
        color: 'var(--text)', textDecoration: 'none', flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px var(--primary-glow)',
        }}>
          <Swords size={15} color="white" />
        </div>
        MatchForge
      </Link>

      {/* Desktop links */}
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {NAV.map(({ to, icon, label }) => (
          <Link key={to} to={to} style={linkStyle(to)}>{icon}{label}</Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {player ? (
          <>
            <Link to="/queue" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: 'var(--success)', background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)', textDecoration: 'none',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <User size={13} />{player.name}
            </Link>
            <button onClick={handleLeave} disabled={leaving} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8, fontSize: 13,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)', cursor: 'pointer',
            }}>
              <LogOut size={13} />
            </button>
          </>
        ) : (
          <Link to="/join" className="btn btn-primary glow-anim" style={{ padding: '7px 16px', fontSize: 13 }}>
            <Swords size={13} />Play Now
          </Link>
        )}

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} style={{
          background: 'transparent', border: 'none', color: 'var(--text-2)',
          padding: 6, cursor: 'pointer',
        }}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: 'var(--bg-2)', borderBottom: '1px solid var(--border-2)',
          padding: 12, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 99,
        }}>
          {NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to} style={linkStyle(to)} onClick={() => setMenuOpen(false)}>
              {icon}{label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
