// src/routes/groups.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Create a new group
router.post('/', async (req, res) => {
  const { group_name } = req.body;
  const user_id = req.user.id;

  if (!group_name) {
    return res.status(400).json({ error: 'group_name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO customer_groups (user_id, group_name) VALUES ($1, $2) RETURNING *',
      [user_id, group_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all groups for the logged-in user, with member count
router.get('/', async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT g.id, g.group_name, g.created_at,
              COUNT(gm.customer_id) AS member_count
       FROM customer_groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       WHERE g.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get one group with its member list
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const group = await pool.query(
      'SELECT * FROM customer_groups WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (group.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await pool.query(
      `SELECT c.id, c.name, c.phone
       FROM group_members gm
       JOIN customers c ON c.id = gm.customer_id
       WHERE gm.group_id = $1
       ORDER BY c.name`,
      [id]
    );

    res.json({ ...group.rows[0], members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a customer to a group
router.post('/:id/members', async (req, res) => {
  const { id } = req.params;
  const { customer_id } = req.body;
  const user_id = req.user.id;

  if (!customer_id) {
    return res.status(400).json({ error: 'customer_id is required' });
  }

  try {
    // Verify the group belongs to this user
    const group = await pool.query('SELECT id FROM customer_groups WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (group.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify the customer belongs to this user
    const customer = await pool.query('SELECT id FROM customers WHERE id = $1 AND user_id = $2', [customer_id, user_id]);
    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await pool.query(
      'INSERT INTO group_members (group_id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, customer_id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a customer from a group
router.delete('/:id/members/:customerId', async (req, res) => {
  const { id, customerId } = req.params;
  const user_id = req.user.id;

  try {
    const group = await pool.query('SELECT id FROM customer_groups WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (group.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND customer_id = $2', [id, customerId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a group entirely
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query('DELETE FROM customer_groups WHERE id = $1 AND user_id = $2 RETURNING id', [id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;