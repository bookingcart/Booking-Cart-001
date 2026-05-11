require('dotenv').config();

const fetch = require('node-fetch');
const { applyCors } = require('../lib/cors');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';


 * }
 */
module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!DUFFEL_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Duffel is not configured (missing DUFFEL_API_KEY)' });
  }

  const offerId = String(req.query.id || '').trim();
  if (!offerId || !offerId.startsWith('off_')) {
    return res.status(400).json({ ok: false, error: 'Missing or invalid offer id (must start with "off_")' });
  }

  try {
    console.log(`Fetching Duffel offer: ${offerId}`);

    const duffelRes = await fetch(`${DUFFEL_BASE_URL}/air/offers/${encodeURIComponent(offerId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    const duffelText = await duffelRes.text();
    let duffelData;
    try {
      duffelData = JSON.parse(duffelText);
    } catch {
      console.error('Duffel offer response is not valid JSON:', duffelText.slice(0, 300));
      return res.status(502).json({ ok: false, error: 'Unexpected response from Duffel.' });
    }

    if (!duffelRes.ok) {
      const firstErr = Array.isArray(duffelData?.errors) ? duffelData.errors[0] : null;
      const msg = firstErr ? `${firstErr.title}: ${firstErr.message}` : 'Failed to fetch offer.';
      console.error('Duffel offer fetch failed:', duffelRes.status, msg);
      return res.status(duffelRes.status >= 500 ? 502 : duffelRes.status).json({ ok: false, error: msg });
    }

    const offer = duffelData?.data;
    if (!offer) {
      return res.status(502).json({ ok: false, error: 'Empty offer response from Duffel.' });
    }

    // Check if the offer has expired
    const expiresAt = offer.expires_at ? new Date(offer.expires_at) : null;
    const available = !expiresAt || expiresAt > new Date();

    return res.json({
      ok: true,
      offer: {
        id: offer.id,
        total_amount: offer.total_amount,
        total_currency: offer.total_currency,
        expires_at: offer.expires_at || null,
        available,
        available_services: offer.available_services || []
      }
    });
  } catch (err) {
    console.error('duffel-offer error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
};
