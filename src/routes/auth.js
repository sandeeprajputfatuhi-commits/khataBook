// src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Signup - naya business owner (client) register karta hai
router.post('/signup', async (req, res) => {
  const { name, phone, business_name, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'name, phone, password required hain' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password kam se kam 6 characters ka ho' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Is phone number se account pehle se bana hai' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, phone, business_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, phone, business_name',
      [name, phone, business_name, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login - phone + password se
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'phone aur password required hain' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Galat phone ya password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Galat phone ya password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: { id: user.id, name: user.name, phone: user.phone, business_name: user.business_name },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;