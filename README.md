# MatchForge — Multiplayer Matchmaking System

> A full-stack real-time matchmaking platform with skill-based algorithms, live ELO ranking, queue intelligence, and simulation tools.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

---

## Features

- **Skill-Based Matching** — Dynamically expanding ELO range (±3/sec) ensures fair matches even off-peak
- **ELO Rating System** — K=32 formula updates after every match; climb Bronze → Master
- **Queue Intelligence** — Live queue position, estimated wait time, skill range visualization
- **Two Algorithms** — Greedy (O(n log n)) vs Graph/Bipartite (scipy optimal) with fairness scoring
- **Simulation Dashboard** — Test 10–1000 players, adjust skill spread, compare algorithms with charts
- **Leaderboard** — Filterable by region and game mode, with tier badges
- **Match History** — Full ELO change log per match
- **Region & Mode Filters** — Progressive relaxation: same region → same mode → any

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Django 4.2, Django REST Framework   |
| Algorithms| Python, NumPy, SciPy (bipartite)    |
| Frontend  | React 18, Vite 5, React Router 6    |
| Charts    | Chart.js + react-chartjs-2          |
| Styling   | Pure CSS variables (dark design system) |
| Database  | SQLite (zero config, dev-ready)     |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone
```bash
git clone https://github.com/tripthiprashant/Multiplayer-matching-system-.git
cd Multiplayer-matching-system-
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```
Backend runs at: **http://localhost:8000**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/join/` | Join matchmaking queue |
| POST | `/api/leave/` | Leave the queue |
| GET | `/api/status/?session_id=` | Queue position, skill range, ELO |
| GET | `/api/match/?session_id=` | Find or retrieve match |
| POST | `/api/match/result/` | Record winner, update ELO |
| GET | `/api/history/` | Match history with ELO deltas |
| GET | `/api/stats/` | Live lobby stats |
| GET | `/api/leaderboard/?region=NA&mode=ranked` | Filtered leaderboard |
| POST | `/api/simulate/` | Run algorithm simulation |
| POST | `/api/simulate/compare/` | Compare Greedy vs Graph |
| GET | `/api/simulations/` | Simulation history |

### Example: Join Queue
```bash
curl -X POST http://localhost:8000/api/join/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1","skill":1500,"region":"NA","game_mode":"ranked"}'
```

### Example: Record Match Result
```bash
curl -X POST http://localhost:8000/api/match/result/ \
  -H "Content-Type: application/json" \
  -d '{"match_id": 1, "winner_id": 2}'
```

---

## Project Structure

```
Multiplayer-matching-system/
├── backend/
│   ├── config/
│   │   ├── settings.py       # Django settings + CORS
│   │   ├── urls.py           # Root URL config
│   │   └── wsgi.py
│   ├── matchmaking/
│   │   ├── models.py         # Player, Match, SimulationResult
│   │   ├── algorithms.py     # Greedy + Graph algorithms
│   │   ├── services.py       # Queue logic, ELO, match history
│   │   ├── views.py          # All API endpoints
│   │   └── urls.py           # App URL routes
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx    # Sticky nav with player status
    │   │   ├── PlayerCard.jsx # ELO, tier, skill bar
    │   │   ├── MatchCard.jsx  # VS layout with quality bar
    │   │   └── TierBadge.jsx  # Bronze → Master badges
    │   ├── pages/
    │   │   ├── Home.jsx       # Hero, live stats, leaderboard preview
    │   │   ├── Join.jsx       # Queue entry form
    │   │   ├── Queue.jsx      # Live polling, skill range bar
    │   │   ├── Match.jsx      # VS screen, win probability, ELO result
    │   │   ├── Leaderboard.jsx # Filterable rankings
    │   │   ├── History.jsx    # Match history with ELO deltas
    │   │   └── Admin.jsx      # Simulation dashboard + charts
    │   ├── context/
    │   │   └── AppContext.jsx # Global player state
    │   ├── services/
    │   │   └── api.js         # Axios API layer
    │   └── hooks/
    │       └── useQueue.js    # 3s polling hook
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ELO Formula

```
E_new = E_old + K × (actual − expected)
expected = 1 / (1 + 10^((opponent_elo − your_elo) / 400))
K = 32
```

## Skill Tier System

| ELO Range | Tier |
|-----------|------|
| 0 – 799 | 🥉 Bronze |
| 800 – 1199 | 🥈 Silver |
| 1200 – 1599 | 🥇 Gold |
| 1600 – 2199 | 💠 Platinum |
| 2200 – 2699 | 💎 Diamond |
| 2700+ | 👑 Master |

---

## Notes

- SQLite is used by default — no database setup needed
- CORS is enabled for `localhost:5173`
- Skill range starts at ±100 and expands +3 per second (max ±600)
- Progressive matching: same region+mode → same mode → any region
