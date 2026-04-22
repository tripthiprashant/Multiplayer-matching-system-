import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const joinQueue        = (data)        => api.post('/join/', data)
export const leaveQueue       = (sessionId)   => api.post('/leave/', { session_id: sessionId })
export const getStatus        = (sessionId)   => api.get(`/status/?session_id=${sessionId}`)
export const getMatch         = (sessionId)   => api.get(`/match/?session_id=${sessionId}`)
export const postMatchResult  = (data)        => api.post('/match/result/', data)
export const getLobbyStats    = ()            => api.get('/stats/')
export const simulate         = (data)        => api.post('/simulate/', data)
export const simulateCompare  = (data)        => api.post('/simulate/compare/', data)
export const getLeaderboard   = (params = {}) => api.get('/leaderboard/', { params })
export const getSimulationHistory = ()        => api.get('/simulations/')
export const getMatchHistory  = (sessionId)   => api.get(`/history/${sessionId ? `?session_id=${sessionId}` : ''}`)

export default api
