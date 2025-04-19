import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';
import { SKIP_SOCKET_TYPE_CHECK, SOCKET_TIMEOUT } from '@/utils/config';

// Determine the socket server URL based on the environment
const getSocketUrl = (): string => {
  // For production deployment (like Vercel)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Use the same domain for production with the API path
    return window.location.origin;
  }
  
  // For local development
  return 'http://localhost:3000';
};

// Create a singleton socket instance
let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 2; // Reduced to fail faster and move to offline mode quickly
let isOfflineMode = false; // Track offline mode state
let manualOfflineMode = false; // Track if user manually enabled offline mode
let connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
let reconnectionInProgress = false;

// Check if we're in offline mode
const checkOfflineStatus = (): boolean => {
  return !navigator.onLine || isOfflineMode || manualOfflineMode;
};

export const getSocket = (): Socket => {
  // Check if we're offline first before attempting socket connection
  if (checkOfflineStatus()) {
    if (!isOfflineMode) {
      console.log('Offline mode detected, using dummy socket');
      isOfflineMode = true;
      
      // Show notification only once when transitioning to offline mode
      toast({
        title: "Offline Mode",
        description: "You are now in offline mode. Some features may be limited.",
        duration: 3000,
      });
    }
    return createDummySocket();
  }
  
  if (!socket) {
    const socketUrl = getSocketUrl();
    console.log('Connecting to socket server at:', socketUrl);
    
    try {
      // Clear any existing connection timeout
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
        connectionTimeoutId = null;
      }

      // Create socket with more robust configuration
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
        reconnectionAttempts: 2, // Reduce to fail faster
        reconnectionDelay: 1000,
        timeout: SOCKET_TIMEOUT || 5000, // Reduced timeout for faster response
        path: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
          ? '/socket.io' 
          : '/socket.io',
        forceNew: true, // Force new connection on each attempt
        reconnection: true,
        autoConnect: true,
      });
      
      // Set up connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', socket?.id);
        connectionAttempts = 0; // Reset connection attempts on success
        isOfflineMode = false; // No longer in offline mode
        
        // Only show connected toast if we were previously offline
        if (manualOfflineMode) {
          manualOfflineMode = false;
          toast({
            description: 'Connected to chat server',
            duration: 3000,
          });
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        connectionAttempts++;
        
        // Set a timeout to switch to offline mode if we can't connect
        if (!connectionTimeoutId && connectionAttempts >= 1) {
          connectionTimeoutId = setTimeout(() => {
            console.log("Connection timeout reached, switching to offline mode");
            isOfflineMode = true;
            socket = null;
            
            // Notify user only on the first failure
            if (connectionAttempts <= 2) {
              toast({
                variant: "destructive",
                title: "Connection Failed",
                description: "Switched to offline mode. Some features may be limited.",
                duration: 5000,
              });
            }
          }, 5000);
        }
        
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          console.log("Maximum connection attempts reached, switching to offline mode");
          isOfflineMode = true;
          socket = null;
          return createDummySocket();
        }
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        
        // Only try to reconnect if we're not in manual offline mode
        if (!manualOfflineMode && (reason === 'io server disconnect' || reason === 'transport close')) {
          // Server disconnected us or transport closed, try to reconnect manually
          setTimeout(() => {
            console.log('Manual reconnection after disconnect');
            if (socket) socket.connect();
          }, 1000);
        }
      });
      
      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        connectionAttempts = 0; // Reset connection attempts on success
        isOfflineMode = false; // No longer in offline mode
        manualOfflineMode = false; // Clear manual offline flag
        
        // Show reconnection toast
        toast({
          description: 'Reconnected to chat server',
          duration: 3000,
        });
      });
      
      socket.on('reconnect_error', (err) => {
        console.error('Socket reconnection error:', err);
        // If multiple reconnect errors, switch to offline mode
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          isOfflineMode = true;
          socket = null;
        }
      });
      
      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed after all attempts');
        isOfflineMode = true;
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: "Could not reconnect to chat server. Switched to offline mode.",
          duration: 5000,
        });
      });
      
      // Listen for browser online/offline events
      window.addEventListener('online', () => {
        console.log('Browser went online');
        // Only attempt reconnection if we're not in manual offline mode
        if (!manualOfflineMode) {
          isOfflineMode = false;
          connectionAttempts = 0;
          console.log('Attempting to reconnect after going online');
          // Small delay to ensure network is really available
          setTimeout(() => {
            forceReconnectSocket();
          }, 1000);
        }
      });
      
      window.addEventListener('offline', () => {
        console.log('Browser went offline');
        isOfflineMode = true;
        toast({
          variant: "destructive",
          title: "Connection lost",
          description: "You are now in offline mode. Some features may be limited.",
          duration: 5000,
        });
      });
      
      // Force an initial connection
      if (!reconnectionInProgress) {
        reconnectionInProgress = true;
        socket.connect();
        
        // Set a timeout to ensure we don't keep trying forever
        setTimeout(() => {
          reconnectionInProgress = false;
          // If still not connected after timeout, switch to offline mode
          if (socket && !socket.connected) {
            isOfflineMode = true;
            toast({
              variant: "destructive",
              title: "Connection timeout",
              description: "Could not connect to the server. Using offline mode.",
              duration: 5000,
            });
          }
        }, 10000);
      }
    } catch (error) {
      console.error('Error initializing socket:', error);
      isOfflineMode = true;
      toast({
        variant: "destructive",
        title: "Connection error",
        description: "Failed to initialize chat connection. Using offline mode.",
        duration: 5000,
      });
      
      // Return a dummy socket that won't throw errors
      return createDummySocket();
    }
  }
  
  // If we're in offline mode or couldn't establish a connection, return dummy socket
  if (isOfflineMode || !socket) {
    return createDummySocket();
  }
  
  return socket;
};

// Create a dummy socket for offline mode
const createDummySocket = (): Socket => {
  console.warn('Creating dummy socket for offline mode');
  const dummySocket = {
    id: 'offline-mode',
    connected: false,
    disconnected: true,
    on: () => dummySocket,
    emit: () => dummySocket,
    connect: () => dummySocket,
    disconnect: () => dummySocket,
    once: () => dummySocket,
    off: () => dummySocket,
    close: () => {},
    io: {
      opts: {},
      engine: null
    }
  } as unknown as Socket;
  
  return dummySocket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected by client');
  }
};

export const isSocketConnected = (): boolean => {
  if (checkOfflineStatus()) return false;
  return !!(socket && socket.connected);
};

export const reconnectSocket = (): void => {
  // Don't attempt reconnection if manually offline
  if (manualOfflineMode) {
    console.log('Not reconnecting - manual offline mode enabled');
    return;
  }
  
  // Reset offline mode flag when manually reconnecting
  isOfflineMode = false;
  
  // Reset connection attempts when manually reconnecting
  connectionAttempts = 0;
  
  if (socket && !socket.connected) {
    console.log('Manually reconnecting socket...');
    socket.connect();
  } else if (!socket) {
    console.log('Creating new socket connection...');
    getSocket();
  }
};

// Force a fresh connection attempt
export const forceReconnectSocket = (): void => {
  // Don't force reconnect if manually offline
  if (manualOfflineMode) {
    console.log('Not forcing reconnection - manual offline mode enabled');
    return;
  }
  
  console.log('Forcing a fresh connection attempt');
  
  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
    socket.close();
    socket = null;
  }
  
  // Reset offline mode and connection attempts
  isOfflineMode = false;
  connectionAttempts = 0;
  
  // Clear any existing connection timeout
  if (connectionTimeoutId) {
    clearTimeout(connectionTimeoutId);
    connectionTimeoutId = null;
  }
  
  // Create a new socket with a slight delay
  setTimeout(() => {
    reconnectionInProgress = true;
    const newSocket = getSocket();
    
    // Set a timeout to check if connection was successful
    setTimeout(() => {
      reconnectionInProgress = false;
      if (newSocket && !newSocket.connected && !isOfflineMode) {
        console.log('Force reconnect failed, switching to offline mode');
        isOfflineMode = true;
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Could not establish connection. Switched to offline mode.",
          duration: 5000,
        });
      }
    }, 5000);
  }, 500);
};

// Manually set offline mode
export const setOfflineMode = (offline: boolean): void => {
  manualOfflineMode = offline;
  isOfflineMode = offline;
  
  if (offline) {
    console.log('Manually entering offline mode');
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    toast({
      title: "Offline Mode",
      description: "You are now in offline mode. Some features may be limited.",
      duration: 3000,
    });
  } else {
    console.log('Manually exiting offline mode');
    reconnectSocket();
  }
};

// Function to check if we're currently in offline mode
export const isOffline = (): boolean => {
  return isOfflineMode || manualOfflineMode || !navigator.onLine;
};

// Function to check if we're in manual offline mode
export const isManualOfflineMode = (): boolean => {
  return manualOfflineMode;
};
