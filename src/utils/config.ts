
// Default Firebase config
export const defaultFirebaseConfig = {
  apiKey: "AIzaSyBhtV6eoUUAjJFZ39w6thZc2CU2T6R8HSM",
  authDomain: "verbo-1831c.firebaseapp.com",
  databaseURL: "https://verbo-1831c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "verbo-1831c",
  storageBucket: "verbo-1831c.firebasestorage.app",
  messagingSenderId: "435891056294",
  appId: "1:435891056294:web:a51c610f611c1ab9c70e67",
};

// Check if using default config
export const USING_DEFAULT_FIREBASE_CONFIG = true;

// Debug connection status
export const DEBUG_CONNECTION_STATUS = false;

// Debug socket events
export const DEBUG_SOCKET_EVENTS = false;

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
