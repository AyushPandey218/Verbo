// Socket.io server URL for chat
export const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'https://verbo-chat-server.glitch.me';

// Whether to use mock socket service as fallback when the real socket server is unreachable
export const USE_MOCK_SOCKET_FALLBACK = true;

// Maximum number of reconnection attempts
export const MAX_RECONNECTION_ATTEMPTS = 5;

// Reconnection delay in milliseconds
export const RECONNECTION_DELAY = 500; // Reduced from 1000 to 500 for faster reconnection

// Prevent duplicate messages - enable this to filter out duplicate messages
export const PREVENT_DUPLICATE_MESSAGES = true;

// Time window in milliseconds to consider messages as duplicates (increased for polls which may take longer to process)
export const DUPLICATE_MESSAGE_WINDOW = 1500;

// Special longer window for poll messages to prevent duplication
export const POLL_DUPLICATE_WINDOW = 3000;

// Whether to perform a thorough cleanup when a user logs out
export const THOROUGH_LOGOUT_CLEANUP = true;

// List of items to clear from localStorage on logout
export const LOGOUT_STORAGE_CLEANUP_ITEMS = [
  'chatUser',
  'messages',
  'roomHistory',
  'chatPreferences',
  'onlineUsersCache'
];

// User online status settings
export const USER_ONLINE_TIMEOUT = 120000; // 2 minutes - users are considered offline after this time
export const UPDATE_ONLINE_STATUS_INTERVAL = 15 * 1000; // Update online status every 15 seconds

// Only show messages from the last 60 seconds
export const MESSAGE_HISTORY_WINDOW = 60 * 1000;

// Room prefixes for different types of rooms
export const ROOM_PREFIXES = {
  PRIVATE: 'private-',
  GROUP: 'group-',
  SYSTEM: 'system-',
};

// Helper to extract private room code from room ID
export const extractPrivateRoomCode = (roomId: string): string | null => {
  if (!isPrivateRoom(roomId)) return null;
  
  // Extract exactly the code following the prefix
  // For example from 'private-ABC123' or 'private-ABC123-customname'
  // Make sure we handle the case with or without a room name after the code
  const withoutPrefix = roomId.substring(ROOM_PREFIXES.PRIVATE.length);
  
  // If there's a dash separator, the code is just the part before the dash
  if (withoutPrefix.includes('-')) {
    return withoutPrefix.split('-')[0];
  }
  
  // Otherwise the entire string after the prefix is the code
  return withoutPrefix;
};

// Helper to check if a room is a private room
export const isPrivateRoom = (roomId: string): boolean => {
  return roomId.startsWith(ROOM_PREFIXES.PRIVATE);
};

// Firebase Configuration Guide:
// To use your own Firebase project, create a .env file in the root of your project
// and add the following values from your Firebase project settings:
/* 
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
*/

// Default Firebase configuration - ONLY used if environment variables are not set
// IMPORTANT: Replace this with your own Firebase config for better reliability
export const defaultFirebaseConfig = {
  apiKey: "AIzaSyBhtV6eoUUAjJFZ39w6thZc2CU2T6R8HSM",
  authDomain: "verbo-1831c.firebaseapp.com",
  databaseURL: "https://verbo-1831c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "verbo-1831c",
  storageBucket: "verbo-1831c.firebasestorage.app",
  messagingSenderId: "435891056294",
  appId: "1:435891056294:web:a51c610f611c1ab9c70e67",
};

// Check if we're using environment variables or default config
export const USING_DEFAULT_FIREBASE_CONFIG = 
  !import.meta.env.VITE_FIREBASE_API_KEY || 
  !import.meta.env.VITE_FIREBASE_DATABASE_URL;

// Connection status debug information - set to false for production
export const DEBUG_CONNECTION_STATUS = false;

// Firebase Rules explanation to help users troubleshoot permission issues
export const FIREBASE_RULES_HELP = `
// For testing, you can use these permissive rules (NOT FOR PRODUCTION):
{
  "rules": {
    ".read": true,
    ".write": true
  }
}

// For a more secure setup, you can use:
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "auth !== null || true", // Anyone can read for a chat app
        ".write": "auth !== null || true" // Anyone can write for a chat app
      }
    },
    "rooms": {
      "$roomId": {
        ".read": "auth !== null || true",
        ".write": "auth !== null || true",
        "messages": {
          ".read": "auth !== null || true",
          ".write": "auth !== null || true"
        },
        "users": {
          ".read": "auth !== null || true",
          ".write": "auth !== null || true"
        }
      }
    },
    "randomMatches": {
      ".read": "auth !== null || true",
      ".write": "auth !== null || true"
    },
    "randomMatchQueue": {
      ".read": "auth !== null || true",
      ".write": "auth !== null || true"
    }
  }
}
`;

// Pre-deployment checklist flags
export const PRE_DEPLOYMENT_CHECKLIST = {
  usingCustomFirebase: !USING_DEFAULT_FIREBASE_CONFIG,
  debugModeDisabled: !DEBUG_CONNECTION_STATUS
};

// Force cleanup user data on logout from Firebase
export const REMOVE_USER_FROM_FIREBASE_ON_LOGOUT = true;

// Force clearing all messages on logout
export const CLEAR_MESSAGES_ON_LOGOUT = true;

// GIF API Configuration
export const GIF_API_KEY = "GZKGwdu6xlIM0iV58yFKJOFLqj0NLXFw"; // Public GIPHY API key
export const GIF_API_URL = "https://api.giphy.com/v1/gifs";
