// src/routes/customers.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware); // is file ke saare routes login zaroori karte hain

// Create a new customer
router.post('/', async (req, res) => {
  const { name, phone } = req.body;
  const user_id = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'name required hai' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO customers (user_id, name, phone) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all customers for the logged-in user, with computed balance
router.get('/', async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.phone,
              COALESCE(SUM(CASE WHEN e.type = 'credit' THEN e.amount ELSE 0 END), 0) AS total_credit,
              COALESCE(SUM(CASE WHEN e.type = 'debit' THEN e.amount ELSE 0 END), 0) AS total_debit,
              COALESCE(SUM(CASE WHEN e.type = 'debit' THEN e.amount ELSE -e.amount END), 0) AS balance
       FROM customers c
       LEFT JOIN entries e ON e.customer_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;