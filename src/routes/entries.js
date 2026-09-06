// src/routes/entries.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Add a new entry (credit = jama, debit = udhar)
router.post('/', async (req, res) => {
  const { customer_id, type, item_name, quantity, rate, amount, note } = req.body;
  const user_id = req.user.id;

  if (!customer_id || !type || !amount) {
    return res.status(400).json({ error: 'customer_id, type, amount required hain' });
  }
  if (!['credit', 'debit'].includes(type)) {
    return res.status(400).json({ error: "type sirf 'credit' ya 'debit' ho sakta hai" });
  }

  try {
    // Verify ki ye customer isi logged-in user ka hai (koi doosre ka customer edit na kar sake)
    const check = await pool.query('SELECT id FROM customers WHERE id = $1 AND user_id = $2', [customer_id, user_id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Ye customer aapka nahi hai' });
    }

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
  const user_id = req.user.id;

  if (!customer_id) return res.status(400).json({ error: 'customer_id required hai' });

  try {
    const check = await pool.query('SELECT id FROM customers WHERE id = $1 AND user_id = $2', [customer_id, user_id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Ye customer aapka nahi hai' });
    }

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