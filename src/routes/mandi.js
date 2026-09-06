// src/routes/mandi.js
// Fetches live mandi (agricultural market) prices from the Indian government's
// open data API (Agmarknet / data.gov.in). No manual entry needed - always live data.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

// GET /api/mandi/rates?state=Rajasthan&commodity=Guar&district=Udaipur
router.get('/rates', async (req, res) => {
  const { state, commodity, district, market } = req.query;
  const apiKey = process.env.MANDI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Mandi API key not configured on server' });
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

  try {
    const response = await fetch(url);
    const data = await response.json();

    const records = (data.records || []).map((r) => ({
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

    res.json({ count: records.length, records });
  } catch (err) {
    console.error('Mandi API error:', err);
    res.status(502).json({ error: 'Could not fetch mandi prices right now, try again later' });
  }
});

module.exports = router;