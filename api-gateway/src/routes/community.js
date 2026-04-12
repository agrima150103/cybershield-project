const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/community/reports
router.get('/reports', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM community_reports ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/community/report
router.post('/report', authenticate, async (req, res) => {
  try {
    const { url, reason } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const result = await db.query(
      'INSERT INTO community_reports (url, reported_by, reason) VALUES ($1, $2, $3) RETURNING *',
      [url, req.user.id, reason || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// POST /api/community/report/:id/vote
router.post('/report/:id/vote', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const column = type === 'up' ? 'upvotes' : 'downvotes';
    const result = await db.query(
      `UPDATE community_reports SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Vote failed' });
  }
});

module.exports = router;