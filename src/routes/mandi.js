// src/routes/mandi.js
// Fetches live mandi (agricultural market) prices from the Indian government's
// open data API (Agmarknet / data.gov.in). No manual entry needed - always live data.

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

// Shared fetch helper - used by both the /rates endpoint here and the
// price-check cron job in routes/cron.js
async function fetchMandiRecords({ state, commodity, district, market }) {
  const apiKey = process.env.MANDI_API_KEY;
  if (!apiKey) {
    throw new Error('Mandi API key not configured on server');
  }

  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: '300',
  });

  if (state) params.append('filters[state.keyword]', state);
  if (commodity) params.append('filters[commodity]', commodity);
  if (district) params.append('filters[district]', district);
  if (market) params.append('filters[market]', market);

  const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.records || []).map((r) => ({
    state: r.state,
    district: r.district,
    market: r.market,
    commodity: r.commodity,
    variety: r.variety,
    arrival_date: r.arrival_date,
    min_price: r.min_price,
    max_price: r.max_price,
    modal_price: r.modal_price,
  }));
}

router.use(authMiddleware);

// GET /api/mandi/rates?state=Rajasthan&commodity=Guar&district=Udaipur
router.get('/rates', async (req, res) => {
  const { state, commodity, district, market } = req.query;
  try {
    const records = await fetchMandiRecords({ state, commodity, district, market });
    res.json({ count: records.length, records });
  } catch (err) {
    console.error('Mandi API error:', err);
    res.status(502).json({ error: 'Could not fetch mandi prices right now, try again later' });
  }
});

// Start tracking a commodity for price-change alerts
router.post('/track', async (req, res) => {
  const { commodity, state, district } = req.body;
  const user_id = req.user.id;

  if (!commodity) {
    return res.status(400).json({ error: 'commodity is required' });
  }

  try {
    // Get today's price as the starting point, so the first alert only fires
    // on the next real change, not immediately.
    const records = await fetchMandiRecords({ commodity, state, district });
    const initialPrice = records.length > 0 ? parseFloat(records[0].modal_price) : null;

    const result = await pool.query(
      `INSERT INTO tracked_commodities (user_id, commodity, state, district, last_price, last_checked)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [user_id, commodity, state || null, district || null, initialPrice]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List what the logged-in user is tracking
router.get('/tracked', async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM tracked_commodities WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stop tracking
router.delete('/track/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  try {
    await pool.query('DELETE FROM tracked_commodities WHERE id = $1 AND user_id = $2', [id, user_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
module.exports.fetchMandiRecords = fetchMandiRecords;