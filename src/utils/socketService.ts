import FirebaseService from './firebaseService';
import { DEBUG_SOCKET_EVENTS } from './config';
import { getSocket, isSocketConnected, reconnectSocket, forceReconnectSocket, isOffline } from './socket';

class SocketService {
  private static instance: SocketService;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private connectionMode: 'socket' | 'firebase' | 'connecting' | 'offline' = 'connecting';
  private connectionTimer: NodeJS.Timeout | null = null;
  private lastConnectionAttempt: number = 0;
  private connectionLock: boolean = false;
  
  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public getSocket(): any | null {
    // Check if we're offline first and immediately use Firebase
    if (isOffline()) {
      console.log("App is offline, using Firebase for communication");
      this.connectionMode = 'offline';
      return FirebaseService.getInstance();
    }
    
    // First try to use the socket.io connection
    if (this.connectionMode === 'socket' || this.connectionMode === 'connecting') {
      try {
        const socketInstance = getSocket();
        if (socketInstance && isSocketConnected()) {
          this.connectionMode = 'socket';
          return socketInstance;
        } else {
          // If socket is not connected and we haven't tried too recently, attempt reconnect
          const now = Date.now();
          if (now - this.lastConnectionAttempt > 10000) { // Don't try reconnecting more than once every 10 seconds
            this.lastConnectionAttempt = now;
            reconnectSocket();
          }
        }
      } catch (error) {
        console.error("Socket.io connection error, falling back to Firebase:", error);
        this.connectionMode = 'firebase';
      }
    }
    
    // Fallback to Firebase
    if (DEBUG_SOCKET_EVENTS) console.log("Using Firebase for real-time communication");
    return FirebaseService.getInstance();
  }

  public connect(): Promise<any> {
    // Check for offline mode first
    if (isOffline()) {
      console.log("Device is offline, using offline mode");
      this.connectionMode = 'offline';
      return Promise.resolve(FirebaseService.getInstance());
    }
    
    // Check for PRIORITY_FIREBASE_FALLBACK flag in config
    // This makes the app use Firebase more quickly in environments where socket.io is problematic
    try {
      const config = require('./config');
      if (config.PRIORITY_FIREBASE_FALLBACK) {
        console.log("Using priority Firebase fallback mode due to config setting");
        this.connectionMode = 'firebase';
        this.connectionLock = false;
        return Promise.resolve(FirebaseService.getInstance());
      }
    } catch (e) {
      console.error("Error checking for priority Firebase fallback:", e);
    }
    
    // Prevent concurrent connection attempts
    if (this.connectionLock) {
      console.log("Connection attempt already in progress, waiting...");
      return new Promise((resolve) => {
        setTimeout(() => {
          this.connect().then(resolve);
        }, 1000);
      });
    }
    
    this.connectionLock = true;
    
    return new Promise((resolve, reject) => {
      try {
        // Reset connection mode to 'connecting' to try socket first
        this.connectionMode = 'connecting';
        
        if (DEBUG_SOCKET_EVENTS) console.log("Attempting to connect to real-time communication service");
        
        try {
          const socketInstance = getSocket();
          
          // Check if socket is already connected
          if (socketInstance.connected) {
            if (DEBUG_SOCKET_EVENTS) console.log("Socket.io already connected");
            this.connectionAttempts = 0;
            this.connectionMode = 'socket';
            this.connectionLock = false;
            resolve(socketInstance);
            return;
          }
          
          // Set up temporary listeners for connection
          const onConnect = () => {
            if (DEBUG_SOCKET_EVENTS) console.log("Socket.io connected successfully");
            socketInstance.off('connect', onConnect);
            socketInstance.off('connect_error', onConnectError);
            this.connectionAttempts = 0;
            this.connectionMode = 'socket';
            this.connectionLock = false;
            
            if (this.connectionTimer) {
              clearTimeout(this.connectionTimer);
              this.connectionTimer = null;
            }
            
            resolve(socketInstance);
          };
          
          const onConnectError = (error: any) => {
            console.error("Socket.io connection error:", error);
            socketInstance.off('connect', onConnect);
            socketInstance.off('connect_error', onConnectError);
            
            // Try to reconnect or fallback to Firebase
            this.handleConnectionError(resolve);
          };
          
          // Listen for connection events
          socketInstance.once('connect', onConnect);
          socketInstance.once('connect_error', onConnectError);
          
          // Force a connection attempt
          socketInstance.connect();
          
          // Set a timeout to avoid hanging
          this.connectionTimer = setTimeout(() => {
            console.log("Socket.io connection timeout, switching to Firebase");
            socketInstance.off('connect', onConnect);
            socketInstance.off('connect_error', onConnectError);
            
            // Force a reconnection with a new socket instance
            forceReconnectSocket();
            
            // Fallback to Firebase after timeout
            this.connectionMode = 'firebase';
            this.connectionLock = false;
            this.connect().then(resolve);
          }, 5000);
          
          return;
        } catch (error) {
          console.error("Socket.io initialization error:", error);
          this.connectionMode = 'firebase';
        }
        
        // Firebase fallback path
        if (DEBUG_SOCKET_EVENTS) console.log("Using Firebase for real-time communication (fallback mode)");
        const firebaseService = FirebaseService.getInstance();
        
        if (!firebaseService.isInitialized()) {
          console.error("Firebase initialization failed. Chat functionality may not work properly.");
          console.error("Please check your Firebase configuration and make sure all required environment variables are set.");
          
          // Even though initialization failed, we'll resolve with the service
          // so the application can at least continue with limited functionality
          setTimeout(() => {
            this.connectionLock = false;
            resolve(firebaseService);
          }, 500);
          return;
        }
        
        // Reset connection attempts on successful connection
        this.connectionAttempts = 0;
        this.connectionLock = false;
        
        setTimeout(() => {
          resolve(firebaseService);
        }, 500);
      } catch (error) {
        this.handleConnectionError(resolve);
      } finally {
        // Clear the timeout if it exists
        if (this.connectionTimer) {
          clearTimeout(this.connectionTimer);
          this.connectionTimer = null;
        }
      }
    });
  }
  
  private handleConnectionError(resolve: (value: any) => void): void {
    this.connectionAttempts++;
    console.error(`Connection error (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
    
    // If we detect we're offline, immediately switch to offline mode
    if (!navigator.onLine || isOffline()) {
      console.log('Device is offline, switching to offline mode');
      this.connectionMode = 'offline';
    } else {
      // Otherwise switch to Firebase fallback
      this.connectionMode = 'firebase';
    }
    
    this.connectionLock = false;
    console.log(`Switching to ${this.connectionMode} mode after connection error`);
    
    const firebaseService = FirebaseService.getInstance();
    if (!firebaseService.isInitialized()) {
      console.error("Firebase initialization failed. Using limited functionality mode.");
    }
    
    // Resolve with Firebase service
    resolve(firebaseService);
  }
  
  public disconnect(): void {
    if (this.connectionMode === 'socket') {
      try {
        const socketInstance = getSocket();
        if (socketInstance && socketInstance.connected) {
          socketInstance.disconnect();
        }
      } catch (error) {
        console.error("Error disconnecting socket:", error);
      }
    }
    
    // Always clean up Firebase listeners
    const firebaseService = FirebaseService.getInstance();
    firebaseService.removeAllListeners();
    console.log("Disconnected from communication services");
  }

  public isConnected(): boolean {
    if (isOffline()) return false;
    
    if (this.connectionMode === 'socket') {
      return isSocketConnected();
    } else {
      const firebaseService = FirebaseService.getInstance();
      return firebaseService.isInitialized();
    }
  }
  
  public getCurrentMode(): string {
    return this.connectionMode;
  }
  
  public forceSocketMode(): void {
    if (isOffline()) {
      console.log("Cannot force socket mode while offline");
      return;
    }
    
    this.connectionMode = 'connecting';
    this.connectionAttempts = 0;
    forceReconnectSocket();
  }

  public isOfflineMode(): boolean {
    return this.connectionMode === 'offline' || isOffline();
  }
}

export default SocketService;
