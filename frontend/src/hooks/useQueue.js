import { useState, useEffect, useRef, useCallback } from 'react'
import { getStatus, getMatch } from '../services/api'

export function useQueue(sessionId, onMatched) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    if (!sessionId) return
    try {
      const statusRes = await getStatus(sessionId)
      const data = statusRes.data
      setStatus(data)
      setError(null)

      if (data.status === 'matched') {
        clearInterval(intervalRef.current)
        try {
          const matchRes = await getMatch(sessionId)
          if (onMatched) onMatched(matchRes.data)
        } catch (e) {
          if (onMatched) onMatched(data)
        }
      }
    } catch (err) {
      setError('Connection lost. Retrying...')
    } finally {
      setLoading(false)
    }
  }, [sessionId, onMatched])

  useEffect(() => {
    if (!sessionId) return
    poll()
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [sessionId, poll])

  return { status, loading, error }
}
