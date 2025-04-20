import { io, Socket } from 'socket.io-client';
import { User } from './messageUtils';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private currentUser: User | null = null;
  private heartbeatInterval: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {
    // Restore user from localStorage on init
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (e) {
      console.error("Error restoring user data:", e);
    }
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  updateCurrentUser(user: User | null): void {
    this.currentUser = user;
    // Store in localStorage for persistence
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    console.log("Socket service user updated:", user?.id);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentUser) {
        console.log("No user, not setting up socket connection");
        reject(new Error("No user available"));
        return;
      }

      console.log("Setting up socket connection");

      // Connect to the WebSocket server
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin
        : 'http://localhost:3000';

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.setupSocketListeners();
      this.startHeartbeat();

      // Resolve when connected
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        this.reconnectAttempts = 0;
        
        // Login after connection
        if (this.currentUser) {
          this.socket.emit('login', this.currentUser);
        }
        
        resolve();
      });

      // Reject if connection fails
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });
    });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });
  }

  private startHeartbeat() {
    // Send heartbeat every 15 seconds to keep connection alive
    if (this.heartbeatInterval === null && this.socket && this.currentUser) {
      this.heartbeatInterval = window.setInterval(() => {
        this.socket?.emit('heartbeat', this.currentUser);
      }, 15000);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket) {
      console.log("Socket not connected");
      return;
    }

    console.log(`Emitting ${event}:`, data);
    this.socket.emit(event, data);
  }

  on(event: string, callback: Function): void {
    if (!this.socket) {
      console.warn('Socket not initialized for event:', event);
      return;
    }
    this.socket.on(event, callback as any);
  }

  off(event: string, callback: Function): void {
    if (!this.socket) return;
    this.socket.off(event, callback as any);
  }

  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear heartbeat
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear current user
    this.currentUser = null;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export default SocketService;
