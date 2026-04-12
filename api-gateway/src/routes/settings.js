const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

    const scans = await db.query('SELECT COUNT(*) as count FROM url_scans WHERE scanned_by = $1', [req.user.id]);

    res.json({
      ...result.rows[0],
      total_scans: parseInt(scans.rows[0].count),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/settings/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username && !email) return res.status(400).json({ error: 'Nothing to update' });

    const fields = [];
    const values = [];
    let idx = 1;

    if (username) { fields.push(`username = $${idx++}`); values.push(username.trim()); }
    if (email) { fields.push(`email = $${idx++}`); values.push(email.trim().toLowerCase()); }
    values.push(req.user.id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/settings/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;