const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/scan', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/yara/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'YARA scan failed' });
  }
});

router.get('/rules', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/yara/rules');
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

module.exports = router;