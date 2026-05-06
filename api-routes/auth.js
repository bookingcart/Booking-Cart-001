/**
 * api-routes/auth.js
 * Email + password authentication: register, login, logout, forgot-password.
 * Uses bcrypt for hashing and JWT for session tokens.
 * All user records are stored in the existing MongoDB "users" collection.
 */
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getCollections } = require('../lib/mongo');
const { getCorsHeaders } = require('../lib/cors');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'bc_jwt_dev_secret_change_in_prod';
const JWT_EXPIRES_IN = '30d';

// Simple in-memory rate limit: { key -> { count, resetAt } }
const rateLimitMap = new Map();
function checkRateLimit(key, maxReq, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateLimitMap.set(key, entry);
  return entry.count <= maxReq;
}

function applyCors(req, res) {
  const h = getCorsHeaders(req);
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v));
}

/** Validate email format */
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
}

/** Validate password: min 8 chars, 1 number, 1 special char */
function isStrongPassword(p) {
  const s = String(p || '');
  return s.length >= 8 && /[0-9]/.test(s) && /[^A-Za-z0-9]/.test(s);
}

/** Sign a JWT for a user document */
function signToken(user) {
  return jwt.sign(
    { sub: String(user._id || user.email), email: user.email, name: user.name || '' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** Get or create in-memory fallback store (dev only) */
function getMemStore() {
  if (!global.__bc_auth_users) global.__bc_auth_users = new Map();
  return global.__bc_auth_users;
}

/**
 * Main handler — routes by sub-path:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   POST /api/auth/forgot-password
 */
module.exports = async (req, res) => {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  // Determine action from sub-path (e.g. /api/auth/register → "register")
  const action = String(req.params?.action || req.query?.action || '').toLowerCase();

  // IP-based rate limiting (10 requests per minute per IP per action)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const rateLimitKey = `${action}:${ip}`;
  if (!checkRateLimit(rateLimitKey, 10, 60_000)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please wait a moment.' });
  }

  // ── Connect to MongoDB (fall back to in-memory for dev) ──────────────────────
  let usersCol = null;
  try {
    const { users } = await getCollections();
    usersCol = users;
  } catch {
    // dev fallback — in-memory store
  }

  const body = req.body || {};

  // ════════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════════════════════════
  if (action === 'register') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim().slice(0, 80);

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        ok: false,
        error: 'Password must be at least 8 characters and include a number and a special character.'
      });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date();

    if (usersCol) {
      // Check for duplicate
      const existing = await usersCol.findOne({ 'profile.email': email });
      if (existing) {
        return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
      }
      const result = await usersCol.insertOne({
        profile: { email, name },
        passwordHash: hash,
        authMethod: 'email',
        createdAt: now,
        updatedAt: now,
        state: { name, email, signedUpAt: now.toISOString() }
      });
      const newUser = { _id: result.insertedId, email, name };
      const token = signToken(newUser);
      return res.status(201).json({ ok: true, token, user: { email, name } });
    } else {
      // Dev in-memory
      const store = getMemStore();
      if (store.has(email)) {
        return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
      }
      const id = `mem_${Date.now()}`;
      store.set(email, { id, email, name, passwordHash: hash, createdAt: now });
      const token = signToken({ _id: id, email, name });
      return res.status(201).json({ ok: true, token, user: { email, name } });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════════════════════════════════════
  if (action === 'login') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    let userDoc = null;
    if (usersCol) {
      userDoc = await usersCol.findOne({ 'profile.email': email });
    } else {
      userDoc = getMemStore().get(email) || null;
    }

    // Prevent user enumeration: always bcrypt-compare even if not found
    const dummyHash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const hash = userDoc?.passwordHash || dummyHash;
    const match = await bcrypt.compare(password, hash);

    if (!userDoc || !match) {
      return res.status(401).json({ ok: false, error: 'Incorrect email or password.' });
    }

    const email_ = userDoc.profile?.email || userDoc.email;
    const name_ = userDoc.profile?.name || userDoc.name || '';
    const token = signToken({ _id: userDoc._id || userDoc.id, email: email_, name: name_ });

    return res.json({ ok: true, token, user: { email: email_, name: name_ } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOGOUT  (client handles token removal, server just ack)
  // ════════════════════════════════════════════════════════════════════════════
  if (action === 'logout') {
    return res.json({ ok: true });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD  (mock flow — logs a reset link, real email needs provider)
  // ════════════════════════════════════════════════════════════════════════════
  if (action === 'forgot-password') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }

    // Generate a short-lived reset token (15 minutes)
    const resetToken = jwt.sign({ sub: email, purpose: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth?reset=${resetToken}`;

    // In production, send this via email provider.
    // For now, log to server console and return success regardless (prevents enumeration).
    console.log(`[AUTH] Password reset link for ${email}: ${resetLink}`);

    // TODO: integrate with email provider (SendGrid, Resend, etc.)

    return res.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent."
    });
  }

  return res.status(404).json({ ok: false, error: 'Unknown auth action.' });
};
