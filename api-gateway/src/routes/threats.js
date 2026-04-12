const express = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/threats/feeds/fetch — pull from all feeds and store
router.get('/feeds/fetch', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/threats/feeds/fetch');
    const data = await response.json();

    // Store entries in database
    let stored = 0;
    for (const entry of data.entries) {
      try {
        await db.query(
          `INSERT INTO threat_entries (url, source, threat_type, confidence, first_seen, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [entry.url, entry.source, entry.threat_type, entry.confidence, entry.first_seen || new Date(), JSON.stringify(entry.metadata)]
        );
        stored++;
      } catch (e) { /* skip duplicates */ }
    }

    res.json({ total_fetched: data.total, stored, message: data.message });
  } catch (err) {
    console.error('[Threats] Error:', err);
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

// GET /api/threats/search?url=...
router.get('/search', authenticate, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url query param required' });

    const result = await db.query(
      'SELECT * FROM threat_entries WHERE url LIKE $1 LIMIT 20',
      [`%${url}%`]
    );
    res.json({ query: url, count: result.rows.length, entries: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/threats/recent
router.get('/recent', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM threat_entries ORDER BY last_seen DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent threats' });
  }
});

module.exports = router;