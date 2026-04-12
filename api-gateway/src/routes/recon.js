const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/recon/port-scan
router.post('/port-scan', authenticate, async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const response = await fetch('http://localhost:8000/api/recon/port-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('[Recon] Port scan error:', err);
    res.status(500).json({ error: 'Port scan failed' });
  }
});

// POST /api/recon/abuse-check
router.post('/abuse-check', authenticate, async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const response = await fetch('http://localhost:8000/api/recon/abuse-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('[Recon] Abuse check error:', err);
    res.status(500).json({ error: 'Abuse check failed' });
  }
});

// POST /api/recon/full
router.post('/full', authenticate, async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const response = await fetch('http://localhost:8000/api/recon/full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('[Recon] Full recon error:', err);
    res.status(500).json({ error: 'Reconnaissance failed' });
  }
});

module.exports = router;