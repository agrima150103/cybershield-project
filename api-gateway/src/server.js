const http = require('http');
const app = require('./app');
const config = require('./config');
const { setupWebSocket } = require('./websocket/ws');

const server = http.createServer(app);

// Attach WebSocket
const wss = setupWebSocket(server);

// Make wss accessible to routes
app.set('wss', wss);

server.listen(config.port, () => {
  console.log(`[CyberShield API] Running on port ${config.port}`);
  console.log(`[CyberShield WS]  WebSocket ready on ws://localhost:${config.port}`);
});