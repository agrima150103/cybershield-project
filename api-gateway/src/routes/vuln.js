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

router.post('/headers', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/vuln/headers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Header scan failed' });
  }
});

module.exports = router;