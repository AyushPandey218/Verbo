
// Custom EventEmitter implementation for browser compatibility
class EventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach((listener) => listener(...args));
    return true;
  }

  removeListener(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      return this;
    }
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

import { User, Message, generateId } from './messageUtils';

// Simple in-memory mock implementation that simulates socket.io
class MockSocket extends EventEmitter {
  id: string;
  connected: boolean = false;
  rooms: Set<string> = new Set();
  
  constructor() {
    super();
    this.id = generateId();
  }

  connect() {
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
    }, 100);
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect', 'client disconnect');
  }
}

// Singleton implementation of a mock Socket service
class MockSocketService {
  private static instance: MockSocketService;
  private sockets: Map<string, MockSocket> = new Map();
  private users: Map<string, User> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // Fixed: Changed from Set to Map
  private roomMessages: Map<string, Message[]> = new Map();

  private constructor() {
    // Initialize with some demo data
    this.roomMessages.set('general', [
      {
        id: 'msg1',
        content: 'Welcome to the general chat room!',
        sender: {
          id: 'system',
          name: 'System',
          email: '',
          photoURL: '',
          online: true
        },
        timestamp: Date.now() - 60000,
        room: 'general',
        reactions: []
      }
    ]);
  }

  public static getInstance(): MockSocketService {
    if (!MockSocketService.instance) {
      MockSocketService.instance = new MockSocketService();
    }
    return MockSocketService.instance;
  }

  public createSocket(): MockSocket {
    const socket = new MockSocket();
    this.sockets.set(socket.id, socket);
    
    // Set up event listeners
    socket.on('login', (user: User) => {
      console.log("Mock: User logged in", user);
      this.users.set(socket.id, user);
      
      // Notify connected users list
      socket.emit('userList', Array.from(this.users.values()));
      this.broadcast('userList', Array.from(this.users.values()), socket.id);
    });
    
    socket.on('join_room', (data: { room: string, user: User }) => {
      const { room, user } = data;
      console.log("Mock: User joining room", room, user);
      
      // Track room membership
      if (!this.rooms.has(room)) {
        this.rooms.set(room, new Set());
      }
      this.rooms.get(room)?.add(socket.id);
      
      // Send room history
      const roomHistory = this.roomMessages.get(room) || [];
      socket.emit('message_history', roomHistory);
      
      // Send room users
      const roomUsers = Array.from(this.rooms.get(room) || [])
        .map(id => this.users.get(id))
        .filter(Boolean) as User[];
        
      this.emitToRoom(room, 'room_users', roomUsers);
    });
    
    socket.on('leave_room', (data: { room: string, user: User }) => {
      const { room, user } = data;
      console.log("Mock: User leaving room", room, user);
      
      if (this.rooms.has(room)) {
        this.rooms.get(room)?.delete(socket.id);
        
        // Update room users
        const roomUsers = Array.from(this.rooms.get(room) || [])
          .map(id => this.users.get(id))
          .filter(Boolean) as User[];
          
        this.emitToRoom(room, 'room_users', roomUsers);
      }
    });
    
    socket.on('send_message', (message: Message) => {
      const room = message.room;
      console.log("Mock: Message sent", message);
      
      // Store message
      if (!this.roomMessages.has(room)) {
        this.roomMessages.set(room, []);
      }
      this.roomMessages.get(room)?.push(message);
      
      // Broadcast message
      this.emitToRoom(room, 'message_received', message);
    });
    
    socket.on('disconnect', () => {
      const user = this.users.get(socket.id);
      console.log("Mock: User disconnected", user);
      
      if (user) {
        // Remove from all rooms
        for (const [room, members] of this.rooms.entries()) {
          if (members.has(socket.id)) {
            members.delete(socket.id);
            
            // Update room users
            const roomUsers = Array.from(members)
              .map(id => this.users.get(id))
              .filter(Boolean) as User[];
              
            this.emitToRoom(room, 'room_users', roomUsers);
          }
        }
        
        // Remove from users
        this.users.delete(socket.id);
        this.sockets.delete(socket.id);
        
        // Notify other users
        this.broadcast('userList', Array.from(this.users.values()));
      }
    });
    
    return socket;
  }
  
  private emitToRoom(room: string, event: string, ...args: any[]) {
    const roomMembers = this.rooms.get(room) || new Set();
    
    for (const socketId of roomMembers) {
      const socket = this.sockets.get(socketId);
      if (socket) {
        socket.emit(event, ...args);
      }
    }
  }
  
  private broadcast(event: string, data: any, excludeSocket?: string) {
    for (const [id, socket] of this.sockets.entries()) {
      if (!excludeSocket || id !== excludeSocket) {
        socket.emit(event, data);
      }
    }
  }
}

// Export the function that creates a mock socket for a user
export function createMockSocketService(user: User) {
  const service = MockSocketService.getInstance();
  const socket = service.createSocket();
  
  // Connect the socket
  socket.connect();
  
  // Login the user
  socket.emit('login', user);
  
  return {
    socket,
    joinRoom: (roomName: string, user: User) => {
      socket.emit('join_room', { room: roomName, user });
      return [user]; // Return mock online users
    },
    leaveRoom: (roomName: string, user: User) => {
      socket.emit('leave_room', { room: roomName, user });
    },
    getMessages: (roomName: string) => {
      return []; // Return empty array initially, socket will receive history
    },
    sendMessage: (message: Message) => {
      socket.emit('send_message', message);
    }
  };
}

export default MockSocketService;
