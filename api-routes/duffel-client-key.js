require('dotenv').config();

const fetch = require('node-fetch');
const { getCorsHeaders } = require('../lib/cors');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';

function applyCors(req, res) {
  const h = getCorsHeaders(req);
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v));
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!DUFFEL_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Duffel is not configured' });
  }

  try {
    const createResponse = await fetch(`${DUFFEL_BASE_URL}/identity/component_client_keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      },
      body: JSON.stringify({ data: {} })
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      console.error('Duffel component client key failed:', createResponse.status, errText.slice(0, 500));
      return res.status(502).json({
        ok: false,
        error: 'Unable to initialize secure payment form.'
      });
    }

    const data = await createResponse.json();
    return res.json({ ok: true, clientKey: data.data.component_client_key });
  } catch (err) {
    console.error('Duffel client key error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to initialize payment form.'
    });
  }
};
