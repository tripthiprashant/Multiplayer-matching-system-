import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [player, setPlayer] = useState(() => {
    try {
      const saved = localStorage.getItem('mf_player')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const savePlayer = useCallback((data) => {
    setPlayer(data)
    if (data) localStorage.setItem('mf_player', JSON.stringify(data))
    else localStorage.removeItem('mf_player')
  }, [])

  const clearPlayer = useCallback(() => {
    setPlayer(null)
    localStorage.removeItem('mf_player')
  }, [])

  return (
    <AppContext.Provider value={{ player, savePlayer, clearPlayer }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
