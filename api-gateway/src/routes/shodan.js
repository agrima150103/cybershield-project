const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/lookup', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/shodan/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: 'Shodan lookup failed' });
  }
});

module.exports = router;