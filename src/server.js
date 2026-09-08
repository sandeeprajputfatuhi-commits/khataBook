// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const entryRoutes = require('./routes/entries');
const groupRoutes = require('./routes/groups');
const mandiRoutes = require('./routes/mandi');
const pushRoutes = require('./routes/push');
const cronRoutes = require('./routes/cron');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/cron', cronRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Khata backend running on port ${PORT}`);
});