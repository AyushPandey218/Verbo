import { io, Socket } from 'socket.io-client';
import { User, generateId } from './messageUtils';

// Define the server URL - default to localhost for development, but use deployed URL in production
const SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || window.location.origin;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private currentUser: User | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: number | null = null;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): Socket {
    if (!this.socket) {
      console.log('Connecting to socket server at:', SERVER_URL);
      
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      this.setupEventListeners();
    }
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
      
      // Re-login user if we have one stored
      if (this.currentUser) {
        this.loginUser(this.currentUser);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server. Reason:', reason);
      
      // Attempt reconnect if not already at max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
        }
        
        this.reconnectTimer = window.setTimeout(() => {
          this.socket?.connect();
        }, 2000);
      }
    });
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public updateCurrentUser(user: User): void {
    this.currentUser = user;
  }

  public loginUser(user: User): void {
    if (this.socket) {
      console.log('Logging in user:', user);
      this.socket.emit('login', user);
    } else {
      console.error('Socket not connected. Cannot login user.');
    }
  }

  public joinRoom(roomName: string, user: User): void {
    if (this.socket) {
      console.log(`User ${user.name} joining room: ${roomName}`);
      this.socket.emit('join_room', { roomName, user });
    } else {
      console.error('Socket not connected. Cannot join room.');
    }
  }

  public leaveRoom(roomName: string): void {
    if (this.socket) {
      console.log(`Leaving room: ${roomName}`);
      this.socket.emit('leave_room', { roomName });
    } else {
      console.error('Socket not connected. Cannot leave room.');
    }
  }

  public sendMessage(message: any): void {
    if (this.socket) {
      console.log('Sending message:', message);
      this.socket.emit('message', message);
    } else {
      console.error('Socket not connected. Cannot send message.');
    }
  }

  public findRandomMatch(user: User): void {
    if (this.socket) {
      console.log('Finding random match for user:', user);
      this.socket.emit('find_random_match', { user });
    } else {
      console.error('Socket not connected. Cannot find random match.');
    }
  }

  public endRandomChat(): void {
    if (this.socket) {
      console.log('Ending random chat');
      this.socket.emit('end_random_chat');
    } else {
      console.error('Socket not connected. Cannot end random chat.');
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.error(`Socket not connected. Cannot listen for ${event} event.`);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default SocketService;