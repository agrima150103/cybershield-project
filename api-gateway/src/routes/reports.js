const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/reports/generate — proxy to detection engine
router.post('/generate', authenticate, async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'PDF generation failed' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cybershield_report.pdf');
    res.send(buffer);
  } catch (err) {
    console.error('[Reports] Error:', err);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

module.exports = router;