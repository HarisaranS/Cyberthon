require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { initSocket } = require('./src/services/socketService');
// Load scheduler (auto-starts with cron jobs)
require('./src/services/schedulerService');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initSocket(server);

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    server.listen(PORT, () => {
      logger.info(`DataSentinel Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
