'use strict';

const { createApp } = require('./app');

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const server = createApp();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`devsecops-starter listening on port ${PORT}`);
});

// Arrêt propre (docker stop envoie SIGTERM)
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
