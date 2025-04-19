
// Default Firebase config
export const defaultFirebaseConfig = {
  apiKey: "AIzaSyCF8TIh5TkuRD9S9Q2RCRH2Rxg_iutpNMU",
  authDomain: "verbo-chat-demo.firebaseapp.com",
  projectId: "verbo-chat-demo",
  storageBucket: "verbo-chat-demo.appspot.com",
  messagingSenderId: "829486829496",
  appId: "1:829486829496:web:d742b7d58f8c4df747dc9b",
  databaseURL: "https://verbo-chat-demo-default-rtdb.firebaseio.com"
};

// Check if using default config
export const USING_DEFAULT_FIREBASE_CONFIG = true;

// Debug connection status - Enable to see detailed connection info
export const DEBUG_CONNECTION_STATUS = true;

// Debug socket events - Enable to see socket events in console
export const DEBUG_SOCKET_EVENTS = true;

// Skip type checking for socket.io (useful for fixing build errors)
export const SKIP_SOCKET_TYPE_CHECK = true;

// IMPORTANT: Reduce connection attempts for faster fallback
export const MAX_SOCKET_CONNECTION_ATTEMPTS = 2; // Reduced from original 5 attempts
export const SOCKET_TIMEOUT = 3000; // Further reduced from 5s to 3s for even faster connection decision

// Socket Server URL - detect automatically based on environment
export const SOCKET_SERVER_URL = window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1' ?
  window.location.origin :
  'http://localhost:3000';

// Message history window
export const MESSAGE_HISTORY_WINDOW = 100;

// Thorough logout cleanup
export const THOROUGH_LOGOUT_CLEANUP = true;

// Remove user from Firebase on logout
export const REMOVE_USER_FROM_FIREBASE_ON_LOGOUT = false;

// User online timeout (in milliseconds)
export const USER_ONLINE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Priority fallback to Firebase for more reliability
export const PRIORITY_FIREBASE_FALLBACK = true; // Changed to true to prioritize Firebase over socket.io

// Default to offline mode when connection fails
export const DEFAULT_TO_OFFLINE_ON_FAILURE = true;

// Storage items to clean up on logout
export const LOGOUT_STORAGE_CLEANUP_ITEMS = [
  'chatUser',
  'currentRoom',
  'authUser',
];

// Check if a room is a private room
export const isPrivateRoom = (roomName: string | null): boolean => {
  if (!roomName) return false;
  return roomName.startsWith('private-');
};

// Extract private room code from room name
export const extractPrivateRoomCode = (roomName: string | null): string | null => {
  if (!roomName || !isPrivateRoom(roomName)) return null;
  
  // Format is private-CODE or private-CODE-custom-name
  const parts = roomName.split('-');
  if (parts.length < 2) return null;
  
  return parts[1];
};

