
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL: string;
}

// Default Firebase config (for development)
// In production, replace this with your own config
export const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyBhtV6eoUUAjJFZ39w6thZc2CU2T6R8HSM",
  authDomain: "verbo-1831c.firebaseapp.com",
  databaseURL: "https://verbo-1831c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "verbo-1831c",
  storageBucket: "verbo-1831c.firebasestorage.app",
  messagingSenderId: "435891056294",
  appId: "1:435891056294:web:a51c610f611c1ab9c70e67"
};
// Check if we have env vars set
const envConfig: Partial<FirebaseConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Use env config if all values are set, otherwise use default
const hasAllEnvVars = Object.values(envConfig).every(val => val !== undefined);
const firebaseConfig = hasAllEnvVars ? envConfig as FirebaseConfig : defaultFirebaseConfig;

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Flag to indicate if we're using the default config
export const USING_DEFAULT_FIREBASE_CONFIG = !hasAllEnvVars;

// Socket.io server URL
export const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || window.location.origin;

// Debug flags
export const DEBUG_CONNECTION_STATUS = false;
export const DEBUG_SOCKET_EVENTS = false;

// Add missing config values
export const USER_ONLINE_TIMEOUT = 60000 * 2; // 2 minutes
export const MESSAGE_HISTORY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
export const REMOVE_USER_FROM_FIREBASE_ON_LOGOUT = true;
export const THOROUGH_LOGOUT_CLEANUP = true;

// Room prefixes
export const ROOM_PREFIXES = {
  PRIVATE: 'private-',
  RANDOM: 'random-',
  GROUP: 'group-'
};

// Storage cleanup items on logout
export const LOGOUT_STORAGE_CLEANUP_ITEMS = ['chatUser', 'chatRoomName', 'chatMessagesDraft'];

// Function to extract room code from private room name
export const extractPrivateRoomCode = (roomName: string): string | null => {
  if (!roomName || !roomName.startsWith('private-')) return null;
  
  const parts = roomName.split('-');
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
};

// Function to check if a room is a private room
export const isPrivateRoom = (roomName: string): boolean => {
  return roomName?.startsWith('private-') || false;
};

export { app, db };
