/**
 * BRAWL — Backend API Server (Deploy-Ready with Database)
 *
 * Uses PostgreSQL when DATABASE_URL is set (production on Render).
 * Falls back to JSON file storage locally (no setup needed).
 *
 * Deploy to Render.com — see DEPLOY.md
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

// ============================================
// DATABASE LAYER
// Uses PostgreSQL if DATABASE_URL is set, otherwise JSON file
// ============================================

let usePostgres = false;
let pool = null;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    usePostgres = true;
    console.log('[DB] Using PostgreSQL');
  } catch(e) {
    console.log('[DB] pg module not installed, falling back to JSON file');
  }
}

// JSON file fallback
const DATA_FILE = path.join(__dirname, 'data.json');

function readDataFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch(e) {}
  return null;
}

function writeDataFile(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('[DB] Failed to write data file:', e.message);
  }
}

// Seed data
const SEED_FIGHTERS = [
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

// ============================================
// DB ACCESS FUNCTIONS
// ============================================

async function initDatabase() {
  if (usePostgres) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fighters (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        handle TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        campus TEXT NOT NULL,
        clout INTEGER DEFAULT 1000,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        founding BOOLEAN DEFAULT FALSE,
        role TEXT DEFAULT 'any',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const count = await pool.query('SELECT COUNT(*) FROM fighters');
    if (parseInt(count.rows[0].count) === 0) {
      for (const f of SEED_FIGHTERS) {
        await pool.query(
          'INSERT INTO fighters (id, name, handle, email, campus, clout, wins, losses, streak, founding) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
          [f.id, f.name, f.handle, 'seed@brawl.dev', f.campus, f.clout, f.wins, f.losses, f.streak, f.founding]
        );
      }
      console.log('[DB] Seeded ' + SEED_FIGHTERS.length + ' fighters');
    }
  } else {
    if (!readDataFile()) {
      writeDataFile({ fighters: SEED_FIGHTERS, nextId: 11 });
      console.log('[DB] Seeded JSON file with ' + SEED_FIGHTERS.length + ' fighters');
    }
  }
}

async function getFighters() {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM fighters ORDER BY clout DESC');
    return res.rows;
  } else {
    const data = readDataFile();
    return data ? data.fighters.sort(function(a,b){return b.clout - a.clout;}) : [];
  }
}

async function findFighter(id) {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM fighters WHERE id = $1', [id]);
    return res.rows[0] || null;
  } else {
    const data = readDataFile();
    return data ? data.fighters.find(function(f){return f.id === id;}) : null;
  }
}

async function findFighterByHandle(handle) {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM fighters WHERE handle = $1', [handle]);
    return res.rows[0] || null;
  } else {
    const data = readDataFile();
    return data ? data.fighters.find(function(f){return f.handle === handle;}) : null;
  }
}

async function getFighterCount() {
  if (usePostgres) {
    const res = await pool.query('SELECT COUNT(*) FROM fighters');
    return parseInt(res.rows[0].count);
  } else {
    const data = readDataFile();
    return data ? data.fighters.length : 0;
  }
}

async function createFighter(fighterData) {
  if (usePostgres) {
    const count = await getFighterCount();
    const isFounding = count < 100;
    const res = await pool.query(
      'INSERT INTO fighters (name, handle, email, campus, clout, founding, role) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [fighterData.name, fighterData.handle, fighterData.email, fighterData.campus, isFounding ? 1200 : 1000, isFounding, fighterData.role || 'any']
    );
    return res.rows[0];
  } else {
    const data = readDataFile();
    const isFounding = data.fighters.length < 100;
    const newFighter = {
      id: data.nextId++,
      name: fighterData.name,
      handle: fighterData.handle,
      email: fighterData.email,
      campus: fighterData.campus,
      clout: isFounding ? 1200 : 1000,
      wins: 0, losses: 0, streak: 0,
      founding: isFounding,
      role: fighterData.role || 'any',
      created_at: new Date().toISOString()
    };
    data.fighters.push(newFighter);
    writeDataFile(data);
    return newFighter;
  }
}

async function updateFighterStats(winnerId, loserId, cloutTransfer) {
  if (usePostgres) {
    await pool.query('UPDATE fighters SET clout = clout + $1, wins = wins + 1, streak = CASE WHEN streak > 0 THEN streak + 1 ELSE 1 END WHERE id = $2', [cloutTransfer, winnerId]);
    await pool.query('UPDATE fighters SET clout = GREATEST(100, clout - $1), losses = losses + 1, streak = CASE WHEN streak < 0 THEN streak - 1 ELSE -1 END WHERE id = $2', [cloutTransfer, loserId]);
  } else {
    const data = readDataFile();
    const winner = data.fighters.find(function(f){return f.id === winnerId;});
    const loser = data.fighters.find(function(f){return f.id === loserId;});
    if (winner) { winner.clout += cloutTransfer; winner.wins++; winner.streak = winner.streak > 0 ? winner.streak + 1 : 1; }
    if (loser) { loser.clout = Math.max(100, loser.clout - cloutTransfer); loser.losses++; loser.streak = loser.streak < 0 ? loser.streak - 1 : -1; }
    writeDataFile(data);
  }
}

// ============================================
// SERVER SETUP
// ============================================

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

let activeBrawls = {};

function calculateCloutTransfer(winnerClout, loserClout) {
  const diff = loserClout - winnerClout;
  const base = 25;
  const bonus = Math.max(0, Math.round(diff / 100));
  return Math.min(50, base + bonus);
}

// ============================================
// REST API
// ============================================

app.get('/api/health', async function(req, res) {
  try {
    const count = await getFighterCount();
    res.json({ status: 'ok', db: usePostgres ? 'postgresql' : 'json-file', fighters: count, uptime: process.uptime() });
  } catch(e) { res.status(500).json({ status: 'error', message: e.message }); }
});

app.get('/api/prompts/random', function(req, res) {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt: prompt, side: Math.random() > 0.5 ? 'attack' : 'defend' });
});

app.get('/api/leaderboard', async function(req, res) {
  try {
    const sortBy = req.query.sort || 'clout';
    let fighters = await getFighters();
    if (req.query.campus) fighters = fighters.filter(function(f){return f.campus === req.query.campus;});
    if (sortBy !== 'clout') fighters.sort(function(a,b){return (b[sortBy]||0) - (a[sortBy]||0);});
    const ranked = fighters.map(function(f, i) { return Object.assign({}, f, { rank: i + 1 }); });
    res.json({ leaderboard: ranked, total: ranked.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/fighters', async function(req, res) {
  try { res.json({ fighters: await getFighters() }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/join', async function(req, res) {
  try {
    const body = req.body || {};
    if (!body.name || body.name.length < 2) return res.status(400).json({ error: 'Name too short' });
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return res.status(400).json({ error: 'Invalid email' });
    if (!body.handle || !/^@[a-zA-Z][a-zA-Z.]{1,19}$/.test(body.handle)) return res.status(400).json({ error: 'Invalid handle' });
    if (!body.campus) return res.status(400).json({ error: 'Campus required' });

    const existing = await findFighterByHandle(body.handle);
    if (existing) return res.status(409).json({ error: 'Handle already taken' });

    const newFighter = await createFighter(body);
    io.emit('fighter_joined', newFighter);
    res.status(201).json({ fighter: newFighter, founding: newFighter.founding });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/brawl/start', async function(req, res) {
  try {
    const body = req.body || {};
    const attacker = await findFighter(body.attackerId);
    const defender = await findFighter(body.defenderId);
    if (!attacker || !defender) return res.status(400).json({ error: 'Invalid fighters' });

    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    const brawlId = 'brawl_' + Date.now();
    activeBrawls[brawlId] = { id: brawlId, prompt, attacker, defender, attackVotes: 0, defendVotes: 0, voters: {}, status: 'live', startedAt: Date.now(), duration: 60000 };

    io.emit('brawl_started', { id: brawlId, prompt, attacker: { id: attacker.id, name: attacker.name, handle: attacker.handle, clout: attacker.clout }, defender: { id: defender.id, name: defender.name, handle: defender.handle, clout: defender.clout } });
    res.json({ brawlId, prompt, attacker, defender, duration: 60000 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/vote', function(req, res) {
  const body = req.body || {};
  const brawl = activeBrawls[body.brawlId];
  if (!brawl) return res.status(404).json({ error: 'Brawl not found' });
  if (brawl.status !== 'live') return res.status(400).json({ error: 'Brawl is not live' });
  if (brawl.voters[body.voterId]) return res.status(400).json({ error: 'Already voted' });

  brawl.voters[body.voterId] = true;
  if (body.fighterId === brawl.attacker.id) brawl.attackVotes++;
  else if (body.fighterId === brawl.defender.id) brawl.defendVotes++;

  io.to(body.brawlId).emit('vote_update', { attackVotes: brawl.attackVotes, defendVotes: brawl.defendVotes });
  res.json({ attackVotes: brawl.attackVotes, defendVotes: brawl.defendVotes });
});

app.post('/api/brawl/end', async function(req, res) {
  try {
    const body = req.body || {};
    const brawl = activeBrawls[body.brawlId];
    if (!brawl) return res.status(404).json({ error: 'Brawl not found' });

    brawl.status = 'ended';
    const winner = brawl.attackVotes > brawl.defendVotes ? brawl.attacker : brawl.defendVotes > brawl.attackVotes ? brawl.defender : null;
    const result = { brawlId: body.brawlId, winner, attackVotes: brawl.attackVotes, defendVotes: brawl.defendVotes };

    if (winner) {
      const loser = winner === brawl.attacker ? brawl.defender : brawl.attacker;
      const transfer = calculateCloutTransfer(winner.clout, loser.clout);
      await updateFighterStats(winner.id, loser.id, transfer);
      result.cloutTransfer = transfer;
    }

    io.emit('brawl_ended', result);
    delete activeBrawls[body.brawlId];
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('*', function(req, res) { res.sendFile(path.join(__dirname, '..', 'index.html')); });

// ============================================
// WEBSOCKET
// ============================================

io.on('connection', function(socket) {
  console.log('Client connected:', socket.id);
  socket.on('join_brawl', function(brawlId) { socket.join(brawlId); });
  socket.on('cast_vote', function(data) {
    const brawl = activeBrawls[data.brawlId];
    if (!brawl || brawl.status !== 'live' || brawl.voters[data.voterId]) return;
    brawl.voters[data.voterId] = true;
    if (data.fighterId === brawl.attacker.id) brawl.attackVotes++;
    else if (data.fighterId === brawl.defender.id) brawl.defendVotes++;
    io.to(data.brawlId).emit('vote_update', { attackVotes: brawl.attackVotes, defendVotes: brawl.defendVotes });
  });
  socket.on('disconnect', function() { console.log('Client disconnected:', socket.id); });
});

// ============================================
// START
// ============================================

const PORT = process.env.PORT || 3000;
initDatabase().then(function() {
  server.listen(PORT, function() {
    console.log('');
    console.log('  BRAWL server running on port ' + PORT);
    console.log('  Database: ' + (usePostgres ? 'PostgreSQL' : 'JSON file (data.json)'));
    console.log('  Frontend: http://localhost:' + PORT);
    console.log('  API:      http://localhost:' + PORT + '/api/health');
    console.log('');
  });
}).catch(function(err) { console.error('Database init failed:', err); process.exit(1); });
