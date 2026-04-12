const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Try to authenticate from query param
    const url = new URL(req.url, `http://localhost`);
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        ws.userId = decoded.id;
        ws.userEmail = decoded.email;
        ws.isAuthenticated = true;
      } catch {
        ws.isAuthenticated = false;
      }
    } else {
      ws.isAuthenticated = false;
    }

    console.log(`[WS] Client connected (auth: ${ws.isAuthenticated})`);

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch {}
    });

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'CyberShield WebSocket connected',
      timestamp: new Date().toISOString(),
    }));
  });

  return wss;
}

// Broadcast to all authenticated clients
function broadcast(wss, event) {
  if (!wss) return;

  const payload = JSON.stringify(event);

  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.isAuthenticated) {
      client.send(payload);
    }
  });
}

// Broadcast to a specific user
function broadcastToUser(wss, userId, event) {
  if (!wss) return;

  const payload = JSON.stringify(event);

  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.userId === userId) {
      client.send(payload);
    }
  });
}

module.exports = { setupWebSocket, broadcast, broadcastToUser };