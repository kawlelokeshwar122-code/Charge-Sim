import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Razorpay from 'razorpay';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'sessions.json');
const PORT = 3001;

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

function readSessions() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/sessions - return all sessions (newest first)
app.get('/api/sessions', (_req, res) => {
  const sessions = readSessions();
  res.json(sessions.slice().reverse());
});

// POST /api/sessions - save session
app.post('/api/sessions', (req, res) => {
  const { bay, car, kwhAdded, costInr, durationMin, finishedAt, paid, paymentId, prepaid, amountPaid } = req.body;

  if (!bay || !car || kwhAdded == null || costInr == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const session = {
    id: Date.now(),
    bay,
    car,
    kwhAdded: +Number(kwhAdded).toFixed(3),
    costInr: +Number(costInr).toFixed(2),
    durationMin: durationMin ?? null,
    finishedAt: finishedAt ?? new Date().toISOString(),
    paid: Boolean(paid),
    paymentId: paymentId ?? null,
    prepaid: Boolean(prepaid),
    amountPaid: amountPaid != null ? +Number(amountPaid).toFixed(2) : null,
  };

  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);

  res.status(201).json(session);
});

// POST /api/create-order - create Razorpay order (amount in ₹)
app.post('/api/create-order', async (req, res) => {
  const { sessionId, amount } = req.body; // amount in ₹

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 1 || numAmount > 100000) {
    return res.status(400).json({ error: 'Amount must be a valid number between ₹1 and ₹1,00,000' });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ error: 'Razorpay keys missing in server/.env' });
  }

  try {
    const amountInPaise = Math.round(numAmount * 100);
    const receipt = `rcpt_${sessionId ? 's' + sessionId : 'pre'}_${Date.now()}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ error: 'Failed to create order', detail: String(err) });
  }
});

// POST /api/verify-payment - verify signature & mark session paid if sessionId given
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, amountPaid } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ ok: false, error: 'Missing payment signature parameters' });
  }

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ ok: false, error: 'Invalid payment signature' });
  }

  // Update session record if sessionId provided
  if (sessionId) {
    const sessions = readSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.paid = true;
      session.paymentId = razorpay_payment_id;
      if (amountPaid != null) {
        session.amountPaid = +Number(amountPaid).toFixed(2);
      }
      writeSessions(sessions);
    }
  }

  res.json({ ok: true, paymentId: razorpay_payment_id });
});

app.listen(PORT, () => {
  console.log(`⚡ API server running at http://localhost:${PORT}`);
  if (!process.env.RAZORPAY_KEY_ID) {
    console.warn('⚠️  RAZORPAY_KEY_ID not set. Please populate server/.env');
  }
});
