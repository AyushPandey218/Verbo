
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

// In-memory storage for random chat matching
const randomChatQueue = new Set();
const activeRandomChats = new Map();

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

  socket.on('find_random_match', (data) => {
    const { user } = data;
    console.log(`User ${user.name} is looking for a random match`);
    
    // Check if user is already in a random chat
    if (activeRandomChats.has(socket.id)) {
      return;
    }
    
    // Find a match from the waiting queue
    for (const waitingSocketId of randomChatQueue) {
      const waitingSocket = io.sockets.sockets.get(waitingSocketId);
      if (waitingSocket && waitingSocket.connected) {
        // Match found!
        randomChatQueue.delete(waitingSocketId);
        const waitingUser = users.get(waitingSocketId);
        
        if (waitingUser) {
          // Create a unique room for the matched users
          const randomRoomName = 'random-' + Math.random().toString(36).substring(2);
          
          // Join both users to the room
          socket.join(randomRoomName);
          waitingSocket.join(randomRoomName);
          
          // Store the match information
          activeRandomChats.set(socket.id, {
            roomName: randomRoomName,
            partnerId: waitingSocketId
          });
          activeRandomChats.set(waitingSocketId, {
            roomName: randomRoomName,
            partnerId: socket.id
          });
          
          // Notify both users about the match
          io.to(socket.id).emit('random_match_found', { matchedUser: waitingUser });
          io.to(waitingSocketId).emit('random_match_found', { matchedUser: user });
          
          return;
        }
      }
    }
    
    // No match found, add user to waiting queue
    randomChatQueue.add(socket.id);
  });

  socket.on('end_random_chat', () => {
    const matchInfo = activeRandomChats.get(socket.id);
    if (matchInfo) {
      const { roomName, partnerId } = matchInfo;
      
      // Remove both users from the room
      socket.leave(roomName);
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.leave(roomName);
      }
      
      // Clean up the match data
      activeRandomChats.delete(socket.id);
      activeRandomChats.delete(partnerId);
      
      // Notify both users that the chat has ended
      io.to(socket.id).emit('random_match_ended');
      io.to(partnerId).emit('random_match_ended');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Clean up random chat data
    randomChatQueue.delete(socket.id);
    const matchInfo = activeRandomChats.get(socket.id);
    if (matchInfo) {
      const { roomName, partnerId } = matchInfo;
      activeRandomChats.delete(socket.id);
      activeRandomChats.delete(partnerId);
      io.to(partnerId).emit('random_match_ended');
    }
    
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
