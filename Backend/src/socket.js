let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    const { FRONTEND_URL, NODE_ENV } = require('./config/env');
    
    io = new Server(httpServer, {
      cors: {
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          const allowedOrigins = [
            FRONTEND_URL,
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
          ];
          if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Clients should emit 'join' with their userId after connecting
      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
