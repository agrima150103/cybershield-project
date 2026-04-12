const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/email/analyze
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { raw_headers } = req.body;
    if (!raw_headers) return res.status(400).json({ error: 'raw_headers is required' });

    const response = await fetch('http://localhost:8000/api/email/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_headers }),
    });

    const result = await response.json();

    // Save to database
    const dbResult = await db.query(
      `INSERT INTO email_analyses (raw_headers, sender_ip, from_domain, spf_result, dkim_result, dmarc_result, is_spoofed, analyzed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        raw_headers,
        result.sender_ip,
        result.from_domain,
        result.spf_result,
        result.dkim_result,
        result.dmarc_result,
        result.is_spoofed,
        req.user.id,
      ]
    );

    res.json({ ...result, id: dbResult.rows[0].id });
  } catch (err) {
    console.error('[Email] Error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;