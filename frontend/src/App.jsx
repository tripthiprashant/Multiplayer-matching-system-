import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Join from './pages/Join'
import Queue from './pages/Queue'
import Match from './pages/Match'
import Admin from './pages/Admin'
import Leaderboard from './pages/Leaderboard'
import History from './pages/History'
import { useApp } from './context/AppContext'

export default function App() {
  const { player } = useApp()
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/join"        element={<Join />} />
        <Route path="/queue"       element={player ? <Queue /> : <Navigate to="/join" replace />} />
        <Route path="/match"       element={<Match />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/history"     element={<History />} />
        <Route path="/admin"       element={<Admin />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
