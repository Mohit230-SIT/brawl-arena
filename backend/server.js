/**
 * BRAWL — Backend API Server (Deploy-Ready)
 * Express + Socket.IO + serves frontend statically
 *
 * Deploy to Render.com (free tier) — see DEPLOY.md
 *
 * Endpoints:
 *   GET  /api/health            → health check
 *   GET  /api/prompts/random    → random debate prompt + assigned side
 *   GET  /api/leaderboard       → campus rankings (filterable)
 *   GET  /api/fighters          → all registered fighters
 *   POST /api/join              → register new fighter
 *   POST /api/brawl/start       → create a new brawl session
 *   POST /api/vote              → cast a vote
 *   POST /api/brawl/end         → end a brawl, calculate clout transfer
 *   GET  /                      → serves frontend (index.html)
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve frontend HTML from project root

// ============================================
// IN-MEMORY DATA STORE
// (Swap for Postgres + Redis in production)
// ============================================

const PROMPTS = [
  'AI-generated art is not real art.',
  'A 4-day work week will destroy the Indian economy.',
  'Prompt engineering is a fake job.',
  'Social media has done more harm than good for democracy.',
  'Remote work is killing ambition.',
  'College degrees will be obsolete in 10 years.',
  'AI should have the right to refuse harmful tasks.',
  'Cancel culture is a force for good.',
  'Coding will be a blue-collar job within 15 years.',
  'Universal Basic Income is inevitable.',
  'Mandatory voting would strengthen democracy.',
  'Tech companies should be treated like utilities.',
  'Traditional education kills creativity.',
  'Data privacy is an illusion.',
  'Anonymity on the internet does more harm than good.'
];

let fighters = [
  { id: 1, name: 'Karthik Reddy', handle: '@karthik.doubles_down', campus: 'iitb', clout: 3650, wins: 12, losses: 3, streak: 5, founding: true },
  { id: 2, name: 'Sneha Iyer', handle: '@sneha.counter_punch', campus: 'iitb', clout: 3480, wins: 11, losses: 4, streak: 3, founding: true },
  { id: 3, name: 'Priya Nair', handle: '@priya.defends', campus: 'iitb', clout: 3102, wins: 10, losses: 5, streak: -1, founding: true },
  { id: 4, name: 'Ishita Gupta', handle: '@ishita.cold_open', campus: 'iitd', clout: 3010, wins: 10, losses: 6, streak: 4, founding: false },
  { id: 5, name: 'Ananya Singh', handle: '@ananya.flip', campus: 'iitm', clout: 2950, wins: 9, losses: 5, streak: 2, founding: false },
  { id: 6, name: 'Meera Joshi', handle: '@meera.rebuttal', campus: 'iitk', clout: 2890, wins: 9, losses: 6, streak: -1, founding: false },
  { id: 7, name: 'Arjun Mehta', handle: '@arjun.attacks', campus: 'iitb', clout: 2847, wins: 8, losses: 6, streak: 2, founding: false },
  { id: 8, name: 'Rohan Verma', handle: '@rohan.flip', campus: 'bits', clout: 2750, wins: 7, losses: 6, streak: -2, founding: false },
  { id: 9, name: 'Dev Patel', handle: '@dev.cold_open', campus: 'iitd', clout: 2410, wins: 8, losses: 7, streak: -2, founding: false },
  { id: 10, name: 'Vikram Rao', handle: '@vikram.pivot', campus: 'vit', clout: 2620, wins: 7, losses: 7, streak: 1, founding: false }
];

let nextFighterId = 11;
let activeBrawls = {};

// ============================================
// HELPERS
// ============================================

function getLeaderboard(sortBy) {
  sortBy = sortBy || 'clout';
  const sorted = fighters.slice().sort(function(a, b) { return b[sortBy] - a[sortBy]; });
  return sorted.map(function(f, i) { return Object.assign({}, f, { rank: i + 1 }); });
}

function calculateCloutTransfer(winnerClout, loserClout) {
  const diff = loserClout - winnerClout;
  const base = 25;
  const bonus = Math.max(0, Math.round(diff / 100));
  return Math.min(50, base + bonus);
}

// ============================================
// REST API
// ============================================

app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', fighters: fighters.length, uptime: process.uptime() });
});

app.get('/api/prompts/random', function(req, res) {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt: prompt, side: Math.random() > 0.5 ? 'attack' : 'defend' });
});

app.get('/api/leaderboard', function(req, res) {
  const sortBy = req.query.sort || 'clout';
  const campus = req.query.campus;
  let board = getLeaderboard(sortBy);
  if (campus) board = board.filter(function(f) { return f.campus === campus; });
  res.json({ leaderboard: board, total: board.length });
});

app.get('/api/fighters', function(req, res) {
  res.json({ fighters: fighters });
});

app.post('/api/join', function(req, res) {
  const body = req.body || {};
  const name = body.name;
  const email = body.email;
  const handle = body.handle;
  const campus = body.campus;
  const role = body.role;

  if (!name || name.length < 2) return res.status(400).json({ error: 'Name too short' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (!handle || !/^@[a-zA-Z][a-zA-Z.]{1,19}$/.test(handle)) return res.status(400).json({ error: 'Invalid handle' });
  if (!campus) return res.status(400).json({ error: 'Campus required' });

  if (fighters.some(function(f) { return f.handle === handle; })) {
    return res.status(409).json({ error: 'Handle already taken' });
  }

  const isFounding = fighters.length < 100;
  const newFighter = {
    id: nextFighterId++,
    name: name,
    handle: handle,
    email: email,
    campus: campus,
    clout: isFounding ? 1200 : 1000,
    wins: 0,
    losses: 0,
    streak: 0,
    role: role || 'any',
    founding: isFounding,
    createdAt: new Date().toISOString()
  };

  fighters.push(newFighter);
  io.emit('fighter_joined', newFighter);
  res.status(201).json({ fighter: newFighter, founding: isFounding });
});

app.post('/api/brawl/start', function(req, res) {
  const body = req.body || {};
  const attackerId = body.attackerId;
  const defenderId = body.defenderId;
  const attacker = fighters.find(function(f) { return f.id === attackerId; });
  const defender = fighters.find(function(f) { return f.id === defenderId; });

  if (!attacker || !defender) return res.status(400).json({ error: 'Invalid fighters' });

  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const brawlId = 'brawl_' + Date.now();

  const brawl = {
    id: brawlId,
    prompt: prompt,
    attacker: attacker,
    defender: defender,
    attackVotes: 0,
    defendVotes: 0,
    voters: {},
    status: 'live',
    startedAt: Date.now(),
    duration: 60000
  };

  activeBrawls[brawlId] = brawl;
  io.emit('brawl_started', {
    id: brawlId,
    prompt: prompt,
    attacker: { id: attacker.id, name: attacker.name, handle: attacker.handle, clout: attacker.clout },
    defender: { id: defender.id, name: defender.name, handle: defender.handle, clout: defender.clout }
  });

  res.json({ brawlId: brawlId, prompt: prompt, attacker: attacker, defender: defender, duration: 60000 });
});

app.post('/api/vote', function(req, res) {
  const body = req.body || {};
  const brawlId = body.brawlId;
  const fighterId = body.fighterId;
  const voterId = body.voterId;
  const brawl = activeBrawls[brawlId];

  if (!brawl) return res.status(404).json({ error: 'Brawl not found' });
  if (brawl.status !== 'live') return res.status(400).json({ error: 'Brawl is not live' });
  if (brawl.voters[voterId]) return res.status(400).json({ error: 'Already voted' });

  brawl.voters[voterId] = true;
  if (fighterId === brawl.attacker.id) brawl.attackVotes++;
  else if (fighterId === brawl.defender.id) brawl.defendVotes++;

  io.to(brawlId).emit('vote_update', {
    attackVotes: brawl.attackVotes,
    defendVotes: brawl.defendVotes
  });

  res.json({ attackVotes: brawl.attackVotes, defendVotes: brawl.defendVotes });
});

app.post('/api/brawl/end', function(req, res) {
  const body = req.body || {};
  const brawlId = body.brawlId;
  const brawl = activeBrawls[brawlId];

  if (!brawl) return res.status(404).json({ error: 'Brawl not found' });

  brawl.status = 'ended';
  const winner = brawl.attackVotes > brawl.defendVotes ? brawl.attacker
              : brawl.defendVotes > brawl.attackVotes ? brawl.defender
              : null;

  const result = { brawlId: brawlId, winner: winner, attackVotes: brawl.attackVotes, defendVotes: brawl.defendVotes };

  if (winner) {
    const loser = winner === brawl.attacker ? brawl.defender : brawl.attacker;
    const transfer = calculateCloutTransfer(winner.clout, loser.clout);

    const winFighter = fighters.find(function(f) { return f.id === winner.id; });
    const loseFighter = fighters.find(function(f) { return f.id === loser.id; });

    winFighter.clout += transfer;
    winFighter.wins++;
    winFighter.streak = winFighter.streak > 0 ? winFighter.streak + 1 : 1;

    loseFighter.clout = Math.max(100, loseFighter.clout - transfer);
    loseFighter.losses++;
    loseFighter.streak = loseFighter.streak < 0 ? loseFighter.streak - 1 : -1;

    result.cloutTransfer = transfer;
    result.winnerClout = winFighter.clout;
    result.loserClout = loseFighter.clout;
  }

  io.emit('brawl_ended', result);
  delete activeBrawls[brawlId];
  res.json(result);
});

// Fallback: serve index.html for any non-API route
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================
// WEBSOCKET (Socket.IO)
// ============================================

io.on('connection', function(socket) {
  console.log('Client connected:', socket.id);

  socket.on('join_brawl', function(brawlId) {
    socket.join(brawlId);
  });

  socket.on('cast_vote', function(data) {
    const brawlId = data.brawlId;
    const fighterId = data.fighterId;
    const voterId = data.voterId;
    const brawl = activeBrawls[brawlId];
    if (!brawl || brawl.status !== 'live') return;
    if (brawl.voters[voterId]) return;

    brawl.voters[voterId] = true;
    if (fighterId === brawl.attacker.id) brawl.attackVotes++;
    else if (fighterId === brawl.defender.id) brawl.defendVotes++;

    io.to(brawlId).emit('vote_update', {
      attackVotes: brawl.attackVotes,
      defendVotes: brawl.defendVotes
    });
  });

  socket.on('disconnect', function() {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
  console.log('');
  console.log('  BRAWL server running on port ' + PORT);
  console.log('  Frontend: http://localhost:' + PORT);
  console.log('  API:      http://localhost:' + PORT + '/api/health');
  console.log('');
});
