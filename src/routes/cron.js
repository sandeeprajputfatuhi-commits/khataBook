// src/routes/cron.js
// This endpoint is NOT protected by user login - it's meant to be called once
// a day by an external free scheduler (e.g. cron-job.org) with a secret key,
// since Render's free tier doesn't include its own cron jobs.

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { Expo } = require('expo-server-sdk');
const { fetchMandiRecords } = require('./mandi');

const expo = new Expo();

router.post('/check-prices', async (req, res) => {
  const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (providedSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Invalid cron secret' });
  }

  try {
    const tracked = await pool.query('SELECT * FROM tracked_commodities');
    let checked = 0;
    let notified = 0;

    for (const item of tracked.rows) {
      checked++;
      let records;
      try {
        records = await fetchMandiRecords({
          commodity: item.commodity,
          state: item.state,
          district: item.district,
        });
      } catch (err) {
        console.error(`Failed to fetch price for tracked item ${item.id}:`, err.message);
        continue;
      }

      if (records.length === 0) continue;

      const currentPrice = parseFloat(records[0].modal_price);
      const previousPrice = item.last_price !== null ? parseFloat(item.last_price) : null;

      // Update the stored price either way, so tomorrow's check compares against today
      await pool.query(
        'UPDATE tracked_commodities SET last_price = $1, last_checked = NOW() WHERE id = $2',
        [currentPrice, item.id]
      );

      if (previousPrice !== null && currentPrice !== previousPrice) {
        const direction = currentPrice > previousPrice ? 'up' : 'down';
        const diff = Math.abs(currentPrice - previousPrice).toFixed(2);
        const message =
          direction === 'up'
            ? `${item.commodity} bhav ₹${diff} chadh gaya - ab ₹${currentPrice}/qtl`
            : `${item.commodity} bhav ₹${diff} gir gaya - ab ₹${currentPrice}/qtl`;

        const tokens = await pool.query('SELECT expo_push_token FROM push_tokens WHERE user_id = $1', [item.user_id]);
        const messages = tokens.rows
          .filter((t) => Expo.isExpoPushToken(t.expo_push_token))
          .map((t) => ({
            to: t.expo_push_token,
            sound: 'default',
            title: 'Mandi Bhav Update',
            body: message,
          }));

        if (messages.length > 0) {
          const chunks = expo.chunkPushNotifications(messages);
          for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
          }
          notified++;
        }
      }
    }

    res.json({ checked, notified });
  } catch (err) {
    console.error('Cron price check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;