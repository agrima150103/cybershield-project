const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

pool.on('connect', () => console.log('[DB] Connected to PostgreSQL'));
pool.on('error', (err) => console.error('[DB] Pool error:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};