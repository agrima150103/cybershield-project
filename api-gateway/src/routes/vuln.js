const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/full', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/vuln/full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Vulnerability scan failed' });
  }
});

router.post('/nikto', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/vuln/nikto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Nikto scan failed' });
  }
});

router.post('/capture', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/vuln/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Network capture failed' });
  }
});

module.exports = router;