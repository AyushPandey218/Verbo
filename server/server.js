
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io' // Use a consistent path
});

// In-memory storage
const users = new Map();
const rooms = new Map();
const messages = new Map();

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Socket.io server is running');
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected with ID:', socket.id);

  socket.on('login', (user) => {
    console.log('User logged in:', user);
    users.set(socket.id, user);
    io.emit('userList', Array.from(users.values()));
  });

  socket.on('join_room', (data) => {
    const { roomName, user } = data;
    console.log(`User ${user.name} joining room: ${roomName}`);
    
    socket.join(roomName);
    
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }
    rooms.get(roomName).add(socket.id);
    
    const roomUsers = Array.from(rooms.get(roomName))
      .map(id => users.get(id))
      .filter(Boolean);
    
    io.to(roomName).emit('room_users', roomUsers);
    
    // Send room history
    const roomHistory = messages.get(roomName) || [];
    socket.emit('room_history', roomHistory);
  });

  socket.on('leave_room', (data) => {
    const { roomName } = data;
    socket.leave(roomName);
    
    if (rooms.has(roomName)) {
      rooms.get(roomName).delete(socket.id);
      
      const roomUsers = Array.from(rooms.get(roomName))
        .map(id => users.get(id))
        .filter(Boolean);
      
      io.to(roomName).emit('room_users', roomUsers);
    }
  });

  socket.on('message', (message) => {
    console.log(`Message in room ${message.room}: ${message.content}`);
    
    if (!messages.has(message.room)) {
      messages.set(message.room, []);
    }
    messages.get(message.room).push(message);
    
    io.to(message.room).emit('chat message', message);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('userList', Array.from(users.values()));
      
      // Remove from all rooms
      for (const [roomName, members] of rooms.entries()) {
        if (members.has(socket.id)) {
          members.delete(socket.id);
          
          const roomUsers = Array.from(members)
            .map(id => users.get(id))
            .filter(Boolean);
          
          io.to(roomName).emit('room_users', roomUsers);
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// For Vercel support
module.exports = app;
