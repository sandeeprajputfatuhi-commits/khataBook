// src/routes/push.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Save (or update) this device's Expo push token against the logged-in user
router.post('/register', async (req, res) => {
  const { token } = req.body;
  const user_id = req.user.id;

  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, expo_push_token) VALUES ($1, $2)
       ON CONFLICT (user_id, expo_push_token) DO NOTHING`,
      [user_id, token]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;