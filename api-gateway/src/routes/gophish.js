const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/gophish/campaigns
router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/gophish/campaigns');
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('[GoPhish] Error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/gophish/campaigns/:id
router.get('/campaigns/:id', authenticate, async (req, res) => {
  try {
    const response = await fetch(`http://localhost:8000/api/gophish/campaigns/${req.params.id}`);
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
});

// GET /api/gophish/pages
router.get('/pages', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/gophish/pages');
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch landing pages' });
  }
});

// GET /api/gophish/templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/gophish/templates');
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/gophish/analyze-url
router.post('/analyze-url', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/gophish/analyze-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'URL analysis failed' });
  }
});

module.exports = router;