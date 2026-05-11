require('dotenv').config();

const fetch = require('node-fetch');
const { applyCors } = require('../lib/cors');

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';


 */
module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!DUFFEL_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Duffel is not configured (missing DUFFEL_API_KEY)' });
  }

  const offerId = String(req.query.offer_id || '').trim();
  if (!offerId || !offerId.startsWith('off_')) {
    return res.status(400).json({ ok: false, error: 'Missing or invalid offer_id' });
  }

  try {
    const duffelRes = await fetch(`${DUFFEL_BASE_URL}/air/seat_maps?offer_id=${encodeURIComponent(offerId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${DUFFEL_API_KEY}`
      }
    });

    const duffelData = await duffelRes.json().catch(() => ({}));

    if (!duffelRes.ok) {
      const firstErr = Array.isArray(duffelData?.errors) ? duffelData.errors[0] : null;
      const msg = firstErr ? `${firstErr.title}: ${firstErr.message}` : 'Failed to fetch seat maps.';
      console.error('Duffel seat_maps failed:', duffelRes.status, msg);
      return res.status(duffelRes.status >= 500 ? 502 : duffelRes.status).json({ ok: false, error: msg });
    }

    return res.json({
      ok: true,
      seatMaps: duffelData.data || []
    });
  } catch (err) {
    console.error('duffel-seat-maps error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
};
