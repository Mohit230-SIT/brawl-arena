# BRAWL Backend

## Quick Start

```bash
cd backend
npm install express socket.io cors
node server.js
```

Server runs on `http://localhost:3000`.

## API Endpoints

### Health Check
```
GET /api/health
→ { status: "ok", fighters: 10, uptime: 12.5 }
```

### Random Prompt
```
GET /api/prompts/random
→ { prompt: "AI art is not real art.", side: "attack" }
```

### Leaderboard
```
GET /api/leaderboard?sort=clout&campus=iitb
→ { leaderboard: [...], total: 10 }
```

### Join (Register Fighter)
```
POST /api/join
Body: { name, email, handle, campus, role }
→ 201 { fighter: {...}, founding: true }
```

### Start a Brawl
```
POST /api/brawl/start
Body: { attackerId: 1, defenderId: 2 }
→ { brawlId, prompt, attacker, defender, duration: 60000 }
```

### Cast Vote (REST)
```
POST /api/vote
Body: { brawlId, fighterId, voterId }
→ { attackVotes: 5, defendVotes: 3 }
```

### End Brawl & Calculate Results
```
POST /api/brawl/end
Body: { brawlId }
→ { brawlId, winner, cloutTransfer, winnerClout, loserClout }
```

### List All Fighters
```
GET /api/fighters
→ { fighters: [...] }
```

## WebSocket (Socket.IO)

Connect and join a brawl room:
```js
socket.emit('join_brawl', brawlId);
```

Cast live vote:
```js
socket.emit('cast_vote', { brawlId, fighterId, voterId });
```

Listen for updates:
```js
socket.on('vote_update', (data) => { ... });
socket.on('brawl_started', (data) => { ... });
socket.on('brawl_ended', (data) => { ... });
socket.on('fighter_joined', (data) => { ... });
```

## Production Notes

- Swap in-memory data for **PostgreSQL** (persistent state) + **Redis** (live counters + sorted set leaderboard)
- Add JWT auth for fighter sessions
- Add rate limiting on vote endpoint
- Add WebRTC SFU (LiveKit) for video streams
- Add safety classifier on prompt generation
