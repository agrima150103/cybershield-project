const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { broadcast, broadcastToUser } = require('../websocket/ws');

const router = express.Router();

// POST /api/scan/url
router.post('/url', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Call Python detection engine
    const response = await fetch('http://localhost:8000/api/scan/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const scanResult = await response.json();

    // Save to database
    const result = await db.query(
      `INSERT INTO url_scans (url, domain, threat_score, is_malicious, scan_source, features, whois_data, ssl_info, scanned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        url,
        scanResult.domain,
        scanResult.threat_score,
        scanResult.is_malicious,
        'user',
        JSON.stringify(scanResult.features),
        JSON.stringify(scanResult.whois_data),
        JSON.stringify(scanResult.ssl_info),
        req.user.id,
      ]
    );

    const savedScan = result.rows[0];

    // WebSocket: broadcast to the user who scanned
    const wss = req.app.get('wss');
    broadcastToUser(wss, req.user.id, {
      type: 'scan_complete',
      data: {
        id: savedScan.id,
        url: savedScan.url,
        domain: savedScan.domain,
        threat_score: scanResult.threat_score,
        is_malicious: scanResult.is_malicious,
        ml_prediction: scanResult.ml_analysis?.ensemble_prediction || 'unknown',
        timestamp: savedScan.created_at,
      },
    });

    // If malicious, broadcast alert to ALL authenticated users
    if (scanResult.is_malicious) {
      broadcast(wss, {
        type: 'threat_alert',
        data: {
          url: savedScan.url,
          domain: savedScan.domain,
          threat_score: scanResult.threat_score,
          ml_prediction: scanResult.ml_analysis?.ensemble_prediction || 'unknown',
          message: `Malicious URL detected: ${savedScan.domain}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Return full scan result to the HTTP response
    res.json({ ...savedScan, ...scanResult });
  } catch (err) {
    console.error('[Scan] Error:', err);
    res.status(500).json({ error: 'Scan failed' });
  }
});

// GET /api/scan/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM url_scans WHERE scanned_by = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;