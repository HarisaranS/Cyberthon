const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.FRONTEND_URL || 'http://localhost,http://localhost:5173').split(',').map(o => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Auth token required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-org', (orgId) => {
      socket.join(`org:${orgId}`);
    });
    socket.on('disconnect', () => {});
  });

  logger.info('Socket.io initialized');
  return io;
};

const emitToOrg = (orgId, event, data) => {
  if (io) io.to(`org:${orgId}`).emit(event, data);
};

const getIO = () => io;

module.exports = { initSocket, emitToOrg, getIO };
