require('dotenv').config();

const fetch = require('node-fetch');
const { getCorsHeaders } = require('../lib/cors');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

function applyCors(req, res) {
  const h = getCorsHeaders(req);
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v));
}

/**
 * POST /api/duffel-payments
 *
 * Pays for a 'held' order.
 * 
 * Body:
 * {
 *   orderId: string,
 *   amount: string,
 *   currency: string
 * }
 */
module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!DUFFEL_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Duffel is not configured' });
  }

  const { orderId, amount, currency } = req.body || {};

  if (!orderId || !amount || !currency) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const paymentPayload = {
    data: {
      order_id: orderId.trim(),
      payment: {
        type: 'balance',
        currency: currency.trim().toUpperCase(),
        amount: String(parseFloat(amount).toFixed(2))
      }
    }
  };

  try {
    const duffelRes = await fetch(`${DUFFEL_BASE_URL}/air/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      },
      body: JSON.stringify(paymentPayload)
    });

    const duffelData = await duffelRes.json().catch(() => ({}));

    if (!duffelRes.ok) {
      const err = duffelData.errors?.[0];
      const msg = err ? `${err.title}: ${err.message}` : 'Payment failed';
      console.error('Duffel payment failed:', duffelRes.status, msg);
      return res.status(duffelRes.status >= 500 ? 502 : duffelRes.status).json({ ok: false, error: msg });
    }

    return res.json({ ok: true, payment: duffelData.data });
  } catch (err) {
    console.error('duffel-payments error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
};
