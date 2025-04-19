
// Socket.io serverless function for Vercel
const { Server } = require('socket.io');
const { createServer } = require('http');
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// In-memory storage (Note: this will be reset on serverless function cold starts)
const users = new Map();
const rooms = new Map();
const messages = new Map();
const userStatus = new Map();
const waitingForRandomMatch = new Set();

// Constants
const MESSAGE_HISTORY_LIMIT = 100;
const INACTIVE_TIMEOUT = 300000; // 5 minutes

// Create an HTTP server
const httpServer = createServer(app);

// Setup Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io',  // Keep this as /socket.io for server side
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  addTrailingSlash: false
});

function handleDisconnect(socketId) {
  const user = users.get(socketId);
  if (user) {
    user.online = false;
    user.lastSeen = Date.now();
    userStatus.delete(user.id);
    users.delete(socketId);
    io.emit('userOffline', { userId: user.id, lastSeen: user.lastSeen });
    
    // Remove from waiting for random match if applicable
    waitingForRandomMatch.delete(socketId);
  }
}

// Find a random match for users
function findRandomMatch(socket, userData) {
  if (waitingForRandomMatch.size === 0) {
    // This user is the first one waiting
    waitingForRandomMatch.add(socket.id);
    console.log(`User ${userData.name} is waiting for a random match. Waiting list: ${waitingForRandomMatch.size}`);
    socket.emit('waiting_for_match');
    return;
  }
  
  // Find another user to match with (not self)
  const waitingUsers = Array.from(waitingForRandomMatch);
  const otherUserSocketId = waitingUsers.find(id => id !== socket.id);
  
  if (!otherUserSocketId) {
    // No other users waiting
    waitingForRandomMatch.add(socket.id);
    console.log(`User ${userData.name} is waiting for a random match. No other users available.`);
    socket.emit('waiting_for_match');
    return;
  }
  
  // Found a match!
  const otherUserSocket = io.sockets.sockets.get(otherUserSocketId);
  const otherUser = users.get(otherUserSocketId);
  
  if (!otherUserSocket || !otherUser) {
    // Something went wrong, other user might have disconnected
    waitingForRandomMatch.delete(otherUserSocketId);
    waitingForRandomMatch.add(socket.id);
    socket.emit('waiting_for_match');
    return;
  }
  
  // Create a unique room ID for these two users
  const privateRoomId = `random-${Math.random().toString(36).substring(2, 8)}`;
  
  console.log(`Matched ${userData.name} with ${otherUser.name} in room ${privateRoomId}`);
  
  // Remove both users from waiting list
  waitingForRandomMatch.delete(socket.id);
  waitingForRandomMatch.delete(otherUserSocketId);
  
  // Join both users to the new random chat room
  socket.join(privateRoomId);
  otherUserSocket.join(privateRoomId);
  
  // Tell both users about their match
  socket.emit('random_match_found', { matchedUser: otherUser, privateRoom: privateRoomId });
  otherUserSocket.emit('random_match_found', { matchedUser: userData, privateRoom: privateRoomId });
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected with ID:', socket.id);

  socket.on('login', (user) => {
    console.log('User logged in:', user);
    
    // Make sure user is marked as online
    user.socketId = socket.id;
    user.online = true;
    user.lastSeen = Date.now();
    user.lastActive = Date.now();
    
    users.set(socket.id, user);
    userStatus.set(user.id, {
      userId: user.id,
      typing: false,
      lastTyping: Date.now()
    });
    
    // Join general room by default
    socket.join('general');
    
    // Broadcast updated user list to everyone
    io.emit('userList', Array.from(users.values()));
  });

  socket.on('join_room', (data) => {
    const { roomName, user } = data;
    console.log(`User ${user?.name} joining room: ${roomName}`);
    
    // Always ensure user is marked as online
    if (user) {
      user.online = true;
      user.lastActive = Date.now();
    }
    
    socket.join(roomName);
    
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }
    rooms.get(roomName).add(socket.id);
    
    // Update user in the users Map
    if (user) {
      users.set(socket.id, {...user, online: true, lastActive: Date.now()});
    }
    
    const roomUsers = Array.from(rooms.get(roomName))
      .map(id => users.get(id))
      .filter(Boolean);
    
    // Broadcast user list to room
    io.to(roomName).emit('room_users', roomUsers);
    
    // Also broadcast updated user list to everyone 
    io.emit('userList', Array.from(users.values()));
    
    // Send existing messages for this room to the newly joined user
    if (messages.has(roomName)) {
      socket.emit('chat message', ...messages.get(roomName));
    }
  });

  socket.on('leave_room', (data) => {
    const { roomName, user } = data;
    console.log(`User ${user?.name} leaving room: ${roomName}`);
    
    socket.leave(roomName);
    
    if (rooms.has(roomName)) {
      rooms.get(roomName).delete(socket.id);
      
      const roomUsers = Array.from(rooms.get(roomName))
        .map(id => users.get(id))
        .filter(Boolean);
      
      io.to(roomName).emit('room_users', roomUsers);
    }
    
    // If user was in random match, let other user know
    if (roomName && roomName.startsWith('random-')) {
      socket.to(roomName).emit('random_match_ended');
    }
  });

  socket.on('find_random_match', (data) => {
    console.log(`${data.user.name} is looking for a random match`);
    findRandomMatch(socket, data.user);
  });

  socket.on('message', (message) => {
    console.log(`Message in room ${message.room}: ${message.isVoiceMessage ? 'Voice Message' : message.content}`);
    
    // Create a proper voice message with correct attributes for broadcasting
    if (message.isVoiceMessage && message.voiceMessage) {
      message.voiceUrl = message.voiceMessage.audioUrl || message.voiceUrl;
    }
    
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
    console.log(`Send message event in room ${message.room}: ${message.content}`);
    io.to(message.room).emit('message_received', message);
  });

  socket.on('voice_message', (message) => {
    console.log(`Voice message received in room ${message.room} from ${message.sender.name}`);
    
    if (!message.voiceUrl) {
      console.error('Voice message missing voiceUrl');
      return;
    }
    
    // Broadcast the voice message to everyone in the room
    io.to(message.room).emit('voice_message', message);
    
    // Also store in message history
    if (!messages.has(message.room)) {
      messages.set(message.room, []);
    }
    const roomMessages = messages.get(message.room);
    roomMessages.push(message);
    if (roomMessages.length > MESSAGE_HISTORY_LIMIT) {
      roomMessages.shift();
    }
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
  
  socket.on('whiteboard_data', (data) => {
    const { data: drawingData, room, sender } = data;
    socket.to(room).emit('whiteboard_data', { data: drawingData, sender });
  });

  socket.on('poll_vote', (voteData) => {
    io.to(voteData.room).emit('poll_vote', voteData);
  });
  
  socket.on('disconnect', () => {
    handleDisconnect(socket.id);
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Socket.io serverless function is running');
});

// Add a specific debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    status: 'Socket server active',
    users: Array.from(users.values()).map(u => ({ id: u.id, name: u.name, online: u.online })),
    rooms: Array.from(rooms.keys()),
    waitingUsers: waitingForRandomMatch.size,
    time: new Date().toISOString(),
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  // Check if this is a socket.io request or a normal HTTP request
  const url = req.url || '';
  
  // Log incoming requests to help debug
  console.log(`[API] Request: ${url}`);
  
  if (url.startsWith('/socket.io/')) {
    // Handle as Socket.IO request through httpServer
    console.log('[API] Handling Socket.IO request');
    httpServer.emit('request', req, res);
  } else {
    // For non-socket requests or debug endpoints
    if (url.startsWith('/debug')) {
      const responseData = {
        status: 'Socket.IO debug endpoint is reachable',
        headers: req.headers,
        time: new Date().toISOString(),
        message: 'If you can see this message, API routes are working correctly on Vercel'
      };
      console.log('[API] Debug request received');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseData, null, 2));
    } else {
      // Standard response
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Socket.IO server is running. Connect to /api/socket');
    }
  }
};
