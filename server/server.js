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
const userStatus = new Map();

// Constants
const MESSAGE_HISTORY_LIMIT = 100;
const TYPING_TIMEOUT = 5000;
const INACTIVE_TIMEOUT = 300000; // 5 minutes

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Socket.io server is running');
});

// Clean up inactive users periodically
setInterval(() => {
  const now = Date.now();
  users.forEach((user, socketId) => {
    const status = userStatus.get(user.id);
    if (status && now - status.lastTyping > INACTIVE_TIMEOUT) {
      handleDisconnect(socketId);
    }
  });
}, INACTIVE_TIMEOUT);

function handleDisconnect(socketId) {
  const user = users.get(socketId);
  if (user) {
    user.online = false;
    user.lastSeen = Date.now();
    userStatus.delete(user.id);
    users.delete(socketId);
    io.emit('userOffline', { userId: user.id, lastSeen: user.lastSeen });
  }
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected with ID:', socket.id);

  socket.on('login', (user) => {
    console.log('User logged in:', user);
    
    user.socketId = socket.id;
    user.online = true;
    user.lastSeen = Date.now();
    
    users.set(socket.id, user);
    userStatus.set(user.id, {
      userId: user.id,
      typing: false,
      lastTyping: Date.now()
    });
    
    // Join general room by default
    socket.join('general');
    io.emit('userList', Array.from(users.values()));
  });

  socket.on('join_room', (data) => {
    const { room, user } = data;
    console.log(`User ${user.name} joining room: ${room}`);
    
    socket.join(room);
    
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);
    
    const roomUsers = Array.from(rooms.get(room))
      .map(id => users.get(id))
      .filter(Boolean);
    
    io.to(room).emit('room_users', roomUsers);
  });

  socket.on('leave_room', (data) => {
    const { room, user } = data;
    console.log(`User ${user?.name} leaving room: ${room}`);
    
    socket.leave(room);
    
    if (rooms.has(room)) {
      rooms.get(room).delete(socket.id);
      
      const roomUsers = Array.from(rooms.get(room))
        .map(id => users.get(id))
        .filter(Boolean);
      
      io.to(room).emit('room_users', roomUsers);
    }
  });

  socket.on('chat message', (message) => {
    console.log(`Message in room ${message.room}: ${message.content}`);
    
    // Store message with limit
    if (!messages.has(message.room)) {
      messages.set(message.room, []);
    }
    const roomMessages = messages.get(message.room);
    roomMessages.push(message);
    if (roomMessages.length > MESSAGE_HISTORY_LIMIT) {
      roomMessages.shift();
    }
    
    // Broadcast to room
    io.to(message.room).emit('chat message', message);
  });

  socket.on('send_message', (message) => {
    io.to(message.room).emit('message_received', message);
  });

  socket.on('typing', (data) => {
    const { isTyping, room } = data;
    const user = users.get(socket.id);
    
    if (user) {
      const status = userStatus.get(user.id);
      if (status) {
        status.typing = isTyping;
        status.lastTyping = Date.now();
        status.room = room;
        
        socket.to(room).emit('user_typing', {
          userId: user.id,
          isTyping
        });
      }
    }
  });

  socket.on('add_reaction', (data) => {
    const { messageId, reaction, user, room } = data;
    io.to(room).emit('reaction_added', { messageId, reaction, user });
  });
  
  socket.on('find_random_match', (data) => {
    console.log(`${data.user.name} is looking for a random match`);
    socket.emit('waiting_for_match');
    
    // Simulate finding a match after 2 seconds
    setTimeout(() => {
      const matchedUser = {
        id: 'simulated-user',
        name: 'Simulated User',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=simulated`,
        online: true
      };
      
      const privateRoom = 'private-' + Math.random().toString(36).substring(7);
      socket.emit('matched', { matchedUser, privateRoom });
      socket.join(privateRoom);
    }, 2000);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket.id);
  });
});

// Start server with better environment variable handling
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// For Vercel support
module.exports = app;
