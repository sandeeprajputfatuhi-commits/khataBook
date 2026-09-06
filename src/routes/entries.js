// src/routes/entries.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Add a new entry (credit = jama, debit = udhar)
router.post('/', async (req, res) => {
  const { customer_id, user_id, type, item_name, quantity, rate, amount, note } = req.body;

  if (!customer_id || !user_id || !type || !amount) {
    return res.status(400).json({ error: 'customer_id, user_id, type, amount required hain' });
  }
  if (!['credit', 'debit'].includes(type)) {
    return res.status(400).json({ error: "type sirf 'credit' ya 'debit' ho sakta hai" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO entries (customer_id, user_id, type, item_name, quantity, rate, amount, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [customer_id, user_id, type, item_name, quantity, rate, amount, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all entries for one customer (history)
router.get('/', async (req, res) => {
  const { customer_id } = req.query;
  if (!customer_id) return res.status(400).json({ error: 'customer_id required hai' });

  try {
    const result = await pool.query(
      'SELECT * FROM entries WHERE customer_id = $1 ORDER BY created_at DESC',
      [customer_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
