
import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

// Determine the socket server URL based on the environment
const getSocketUrl = (): string => {
  // For production deployment (like Vercel)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Use the same domain for production with the API path
    return `${window.location.origin}`;
  }
  
  // For local development
  return 'http://localhost:3000';
};

// Create a singleton socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    console.log('Connecting to socket server at:', socketUrl);
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: '/socket.io', // This will route to /api/socket on Vercel
      forceNew: true,
      reconnection: true,
      autoConnect: true,
    });
    
    // Set up connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully with ID:', socket?.id);
      toast({
        description: 'Connected to chat server',
        duration: 3000,
      });
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast({
        variant: "destructive",
        title: "Connection error",
        description: "Failed to connect to chat server. Using fallback mode.",
        duration: 5000,
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socket?.connect();
      }
    });
  }
  
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected by client');
  }
};
