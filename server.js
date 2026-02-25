const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Data file path
const DATA_FILE = path.join(__dirname, 'leaderboard.json');

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }, null, 2));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '1kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple rate limiting (per IP, 10 requests per minute)
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const window = 60000; // 1 minute
  const max = 10;

  if (!rateMap.has(ip)) rateMap.set(ip, []);
  const hits = rateMap.get(ip).filter(t => now - t < window);
  hits.push(now);
  rateMap.set(ip, hits);

  if (hits.length > max) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }
  next();
}

// Clean up rate map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of rateMap) {
    const valid = hits.filter(t => now - t < 60000);
    if (valid.length === 0) rateMap.delete(ip);
    else rateMap.set(ip, valid);
  }
}, 300000);

// Read leaderboard
function readLB() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { scores: [] };
  }
}

// Write leaderboard
function writeLB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ==============================
// API ENDPOINTS
// ==============================

// GET /api/leaderboard — returns top 50 scores
app.get('/api/leaderboard', (req, res) => {
  const data = readLB();
  const top = data.scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
  res.json({ scores: top });
});

// POST /api/score — submit a new score
app.post('/api/score', rateLimit, (req, res) => {
  const { name, score, coin, time } = req.body;

  // Validate
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 16) {
    return res.status(400).json({ error: 'Name required (1-16 chars)' });
  }
  if (typeof score !== 'number' || score < 0 || score > 999999) {
    return res.status(400).json({ error: 'Invalid score' });
  }
  if (!coin || typeof coin !== 'string') {
    return res.status(400).json({ error: 'Coin required' });
  }
  if (typeof time !== 'number' || time < 0) {
    return res.status(400).json({ error: 'Invalid time' });
  }

  const cleanName = name.trim().replace(/[<>"'&]/g, '').substring(0, 16);
  const cleanCoin = coin.trim().substring(0, 6);

  const data = readLB();
  const now = new Date().toISOString();

  // Check if player exists — update if new score is higher
  const existing = data.scores.find(s => s.name.toLowerCase() === cleanName.toLowerCase());

  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      existing.coin = cleanCoin;
      existing.time = time;
      existing.date = now;
    }
  } else {
    data.scores.push({
      name: cleanName,
      score: score,
      coin: cleanCoin,
      time: time,
      date: now
    });
  }

  // Keep only top 200
  data.scores.sort((a, b) => b.score - a.score);
  data.scores = data.scores.slice(0, 200);

  writeLB(data);

  // Return updated top 50
  res.json({
    success: true,
    rank: data.scores.findIndex(s => s.name.toLowerCase() === cleanName.toLowerCase()) + 1,
    scores: data.scores.slice(0, 50)
  });
});

// GET /api/stats — basic stats
app.get('/api/stats', (req, res) => {
  const data = readLB();
  const total = data.scores.length;
  const best = total > 0 ? data.scores.sort((a, b) => b.score - a.score)[0] : null;
  res.json({ totalPlayers: total, topPlayer: best });
});

// Serve game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start
app.listen(PORT, () => {
  console.log(`🎮 Liquid Runner server running on port ${PORT}`);
  console.log(`   Open http://localhost:${PORT} to play`);
  console.log(`   Leaderboard API: /api/leaderboard`);
});
