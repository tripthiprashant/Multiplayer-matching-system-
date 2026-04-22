import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TierBadge from '../components/TierBadge'
import { Home, RefreshCw } from 'lucide-react'

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function getWinningLine(board) {
  for (const line of WIN_LINES) {
    const [a,b,c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line
  }
  return null
}

function Cell({ value, index, onClick, disabled, isWinning }) {
  const color = value === 'X' ? 'var(--primary-light)' : value === 'O' ? '#F472B6' : 'transparent'
  return (
    <button
      onClick={() => onClick(index)}
      disabled={disabled || !!value}
      style={{
        width: '100%', aspectRatio: '1',
        background: isWinning ? 'rgba(99,102,241,0.18)' : 'var(--bg-3)',
        border: isWinning ? '2px solid var(--primary)' : '2px solid var(--border-2)',
        borderRadius: 14,
        fontSize: 'clamp(28px, 8vw, 52px)',
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        color,
        cursor: disabled || value ? 'default' : 'pointer',
        transition: 'all 0.15s',
        textShadow: value ? `0 0 20px ${color}` : 'none',
        transform: isWinning ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      {value}
    </button>
  )
}

export default function Game() {
  const { match_id }  = useParams()
  const navigate      = useNavigate()
  const { player }    = useApp()

  const wsRef         = useRef(null)
  const [board, setBoard]         = useState(Array(9).fill(''))
  const [mySymbol, setMySymbol]   = useState(null)
  const [turn, setTurn]           = useState('X')
  const [status, setStatus]       = useState('connecting') // connecting|waiting|playing|finished
  const [result, setResult]       = useState(null)         // { type, winner_id, message }
  const [wsError, setWsError]     = useState(null)
  const [winLine, setWinLine]     = useState(null)
  const [eloResult, setEloResult] = useState(null)

  const isMyTurn = mySymbol && turn === mySymbol && status === 'playing'

  const connect = useCallback(() => {
    if (!player?.player_id && !player?.id) return
    const pid = player.player_id ?? player.id

    const ws = new WebSocket(`ws://localhost:8000/ws/game/${match_id}/`)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('waiting')
      ws.send(JSON.stringify({ type: 'join', player_id: pid }))
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.type === 'joined') {
        setMySymbol(msg.symbol)
        applyState(msg.state)
      }

      if (msg.type === 'start') {
        applyState(msg.state)
        setStatus('playing')
      }

      if (msg.type === 'update') {
        applyState(msg.state)
      }

      if (msg.type === 'end') {
        if (msg.state) applyState(msg.state)
        setStatus('finished')
        setResult(msg)
        if (msg.result === 'win') {
          const line = getWinningLine(msg.state?.board ?? board)
          setWinLine(line)
        }
      }

      if (msg.type === 'error') {
        setWsError(msg.message)
      }
    }

    ws.onerror = () => setWsError('WebSocket connection failed.')
    ws.onclose = () => {
      if (status !== 'finished') setWsError('Connection closed.')
    }
  }, [match_id, player])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])

  const applyState = (state) => {
    if (!state) return
    if (state.board) setBoard([...state.board])
    if (state.turn)  setTurn(state.turn)
    if (state.status === 'playing') setStatus('playing')
  }

  const handleCellClick = (index) => {
    if (!isMyTurn || board[index] || status !== 'playing') return
    wsRef.current?.send(JSON.stringify({ type: 'move', position: index }))
  }

  const handleGoToResult = () => navigate('/match')
  const handleHome       = () => navigate('/')

  // ── Result overlay ────────────────────────────────────────────────────────
  const pid = player?.player_id ?? player?.id
  const iWon = result?.winner_id === pid
  const isDraw = result?.result === 'draw'
  const isDisconnect = result?.result === 'disconnect'

  const resultText = isDraw ? "It's a Draw! 🤝"
    : isDisconnect ? result?.message
    : iWon ? '🏆 You Win!'
    : '😔 You Lose'

  const resultColor = isDraw ? 'var(--warning)'
    : iWon ? 'var(--success)'
    : 'var(--error)'

  return (
    <div className="page">
      <div className="container page-content" style={{ maxWidth: 520 }}>

        {/* Header */}
        <div className="animate-in" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>⚔️ Tic-Tac-Toe</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Match #{match_id}</p>
        </div>

        {/* Status bar */}
        <div className="card animate-in" style={{ padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {status === 'connecting' && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Connecting…</span>}
            {status === 'waiting'    && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--warning)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block', animation: 'pulse-ring 1.5s ease-out infinite' }} />
                Waiting for opponent…
              </span>
            )}
            {status === 'playing' && (
              <span style={{ fontSize: 13, color: isMyTurn ? 'var(--success)' : 'var(--text-2)' }}>
                {isMyTurn ? '✅ Your turn' : "⏳ Opponent's turn"}
              </span>
            )}
            {status === 'finished' && (
              <span style={{ fontSize: 13, fontWeight: 700, color: resultColor }}>{resultText}</span>
            )}
          </div>
          {mySymbol && (
            <span style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 14, fontWeight: 900,
              background: mySymbol === 'X' ? 'rgba(99,102,241,0.15)' : 'rgba(244,114,182,0.15)',
              color: mySymbol === 'X' ? 'var(--primary-light)' : '#F472B6',
              border: `1px solid ${mySymbol === 'X' ? 'rgba(99,102,241,0.3)' : 'rgba(244,114,182,0.3)'}`,
              fontFamily: 'var(--font-display)',
            }}>
              You: {mySymbol}
            </span>
          )}
        </div>

        {/* Turn indicator */}
        {status === 'playing' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['X', 'O'].map(sym => (
              <div key={sym} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, textAlign: 'center',
                background: turn === sym ? (sym === 'X' ? 'rgba(99,102,241,0.15)' : 'rgba(244,114,182,0.15)') : 'var(--bg-3)',
                border: `1px solid ${turn === sym ? (sym === 'X' ? 'rgba(99,102,241,0.4)' : 'rgba(244,114,182,0.4)') : 'var(--border-2)'}`,
                transition: 'all 0.2s',
              }}>
                <span style={{
                  fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)',
                  color: sym === 'X' ? 'var(--primary-light)' : '#F472B6',
                }}>{sym}</span>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {turn === sym ? 'Moving' : 'Waiting'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Board */}
        <div className="card card-glow animate-in" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {board.map((cell, i) => (
              <Cell
                key={i}
                value={cell}
                index={i}
                onClick={handleCellClick}
                disabled={!isMyTurn || status !== 'playing'}
                isWinning={winLine?.includes(i) ?? false}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {wsError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', fontSize: 13 }}>
            {wsError}
          </div>
        )}

        {/* Result card */}
        {status === 'finished' && (
          <div className="card animate-in" style={{ padding: 24, marginBottom: 16, textAlign: 'center', border: `1px solid ${resultColor}44` }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {isDraw ? '🤝' : iWon ? '🏆' : '😔'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: resultColor, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              {resultText}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {iWon ? 'ELO updated — check your leaderboard ranking!' : isDraw ? 'No ELO change for draws.' : 'Better luck next time!'}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {status === 'finished' && (
            <button onClick={handleGoToResult} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <RefreshCw size={16} />View Match Result
            </button>
          )}
          <button onClick={handleHome} className="btn btn-ghost" style={{ padding: '12px 16px' }}>
            <Home size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
