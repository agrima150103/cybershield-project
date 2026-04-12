const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Middleware: check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const result = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch {
    res.status(500).json({ error: 'Auth check failed' });
  }
};

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    const scans = await db.query('SELECT COUNT(*) as count FROM url_scans');
    const malicious = await db.query('SELECT COUNT(*) as count FROM url_scans WHERE is_malicious = true');
    const reports = await db.query('SELECT COUNT(*) as count FROM community_reports');
    const threats = await db.query('SELECT COUNT(*) as count FROM threat_entries');
    const emails = await db.query('SELECT COUNT(*) as count FROM email_analyses');

    const recentScans = await db.query(
      'SELECT COUNT(*) as count FROM url_scans WHERE created_at > NOW() - INTERVAL \'7 days\''
    );

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_scans: parseInt(scans.rows[0].count),
      malicious_scans: parseInt(malicious.rows[0].count),
      total_reports: parseInt(reports.rows[0].count),
      total_threats: parseInt(threats.rows[0].count),
      total_emails: parseInt(emails.rows[0].count),
      scans_this_week: parseInt(recentScans.rows[0].count),
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'analyst', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
      [role, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/community-reports
router.get('/community-reports', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM community_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// PUT /api/admin/community-reports/:id/status
router.put('/community-reports/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await db.query(
      'UPDATE community_reports SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;