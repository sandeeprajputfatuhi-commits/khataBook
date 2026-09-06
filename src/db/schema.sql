-- Phase 1 schema: core khata book tables
-- Run this once on your Postgres database (Render free Postgres works fine)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  business_name VARCHAR(150),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 'credit' = customer ne diya (jama), 'debit' = customer ko udhar diya
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')) NOT NULL,
  item_name VARCHAR(100),
  quantity NUMERIC(10,2),
  rate NUMERIC(10,2),
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_groups (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER REFERENCES customer_groups(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, customer_id)
);

-- Phase 2 (mandi bhav + reminders) will add more tables later.

CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_customer ON entries(customer_id);
