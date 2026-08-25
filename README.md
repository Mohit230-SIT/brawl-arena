# BRAWL — Live Debate Arena

> Speak your mind. Defend the rest.

A nightly live debate platform that crosses Shark Tank with a fighting game. Two students enter the live-stream arena. The AI generates a controversial prompt. They're randomly assigned to attack or defend. 60 seconds. No prep. The campus votes live. Winner steals the loser's clout rating.

## What's Inside

```
brawl-website/
├── index.html          ← Landing page (hero, arena demo, thesis, CTA)
├── arena.html          ← Interactive arena simulator (60s timer, live voting, prompt generator)
├── leaderboard.html    ← Campus rankings (podium, filters, stats)
├── play.html           ← How to play (rules, scoring, modes, tips, FAQ)
├── about.html          ← Vision, architecture, roadmap, team, demo script
├── join.html           ← Early access signup (form validation, founding perks)
├── css/
│   └── style.css       ← Shared stylesheet (all pages, responsive, dark/light)
├── js/
│   └── main.js         ← Shared JS (nav toggle, scroll reveal, countdown, localStorage)
└── backend/
    ├── server.js       ← Express + Socket.IO API (leaderboard, voting, prompts, brawl sessions)
    ├── package.json    ← Dependencies
    └── README.md       ← API documentation
```

## Quick Start

### Frontend (no build step)
Open `index.html` in any browser. That's it. No server needed.

### Backend (optional)
```bash
cd backend
npm install express socket.io cors
node server.js
```
Backend runs on `http://localhost:3000`. See `backend/README.md` for full API docs.

## Features

**6 Full Pages** — Each with its own purpose, all sharing a cohesive design system.

**Interactive Arena** — Generate random prompts, start a 60-second countdown, cast votes, see live results with vote bars and winner declaration. Try it on `arena.html`.

**Leaderboard** — Top 3 podium with avatars, full 12-fighter ranking table, filterable by time period, campus stats dashboard.

**Complete Rules System** — Scoring table with clout values, 3 game modes (Classic 1v1, Team 2v2, King of the Hill), strategy tips from top players, FAQ.

**Working Backend** — Full Express REST API + Socket.IO WebSocket for live voting. In-memory data store with 10 seeded fighters, clout transfer calculations, and brawl session management.

**Fully Responsive** — Mobile hamburger menu, tablet breakpoints, desktop full grids. Tested across phone/tablet/laptop widths. Dark mode (default) + light mode auto-switching.

**Cross-OS** — Font rendering optimized for macOS (antialiased), Windows (Segoe UI fallback), Linux. Scrollbars styled for Chrome, Firefox, and Safari. Safe-area insets for notched phones.

**Bonus** — Print styles for pitch handouts. Reduced-motion support. Accessibility (keyboard nav, ARIA labels, 44px touch targets).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom properties, grid, clamp), Vanilla JS |
| Backend | Node.js, Express, Socket.IO |
| Real-time | WebSocket (Socket.IO) |
| Data (demo) | In-memory (swap for Postgres + Redis) |
| Video (prod) | WebRTC + LiveKit SFU |
| Fonts | Bricolage Grotesque + Fragment Mono (Google Fonts) |

## Built for a College Competition

This is a complete project — not a mockup. The arena page works. The leaderboard has real data. The backend runs. The form validates. The scoring system is defined. The architecture is documented. The pitch script is included.

Present it, demo the arena live, and let the work speak.
