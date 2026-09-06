// scripts/run-schema.js
// Ye script schema.sql file ko database pe run kar deta hai.
// Chalane ka tareeka: node scripts/run-schema.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render Postgres ke liye zaroori hai
});

async function runSchema() {
  const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Schema file mil gayi, database pe run kar raha hoon...');

  try {
    await pool.query(sql);
    console.log('✅ Tables ban gaye! (users, customers, entries, customer_groups, group_members)');
  } catch (err) {
    console.error('❌ Error aaya:', err.message);
  } finally {
    await pool.end();
  }
}

runSchema();