const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/check-password', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/breach/check-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Breach check failed' });
  }
});

router.post('/check-email', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/breach/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Email breach check failed' });
  }
});

module.exports = router;