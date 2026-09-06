// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const customerRoutes = require('./routes/customers');
const entryRoutes = require('./routes/entries');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/customers', customerRoutes);
app.use('/api/entries', entryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Khata backend running on port ${PORT}`);
});
