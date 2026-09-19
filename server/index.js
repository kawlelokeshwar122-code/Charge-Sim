import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'sessions.json');
const PORT = 3001;

// ── Helpers ───────────────────────────────────────────────
function readSessions() {
  if (!fs.existsSync(DB_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return []; }
}

function writeSessions(sessions) {
  fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2));
}

// ── App ───────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

/** GET /api/sessions — return all sessions, newest first */
app.get('/api/sessions', (_req, res) => {
  const sessions = readSessions();
  res.json(sessions.slice().reverse());
});

/** POST /api/sessions — save a finished session */
app.post('/api/sessions', (req, res) => {
  const { bay, car, kwhAdded, costInr, durationMin, finishedAt } = req.body;

  if (!bay || !car || kwhAdded == null || costInr == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session = {
    id: Date.now(),
    bay,
    car,
    kwhAdded: +kwhAdded.toFixed(3),
    costInr: +costInr.toFixed(2),
    durationMin: durationMin ?? null,
    finishedAt: finishedAt ?? new Date().toISOString(),
  };

  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);

  res.status(201).json(session);
});

app.listen(PORT, () => {
  console.log(`⚡ API server running at http://localhost:${PORT}`);
});
