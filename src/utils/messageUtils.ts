import { formatDistanceToNow } from 'date-fns';

// Define types
export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  online: boolean;
  isGuest?: boolean;
  friends?: string[]; // Array of friend user IDs
  lastActive?: number; // Timestamp of the user's last activity
  leftAt?: number; // Timestamp when user went offline
  joinedAt?: number; // Timestamp when user joined (came online)
  inRandomChat?: boolean;
  searchingForMatch?: boolean;
}

export interface Reaction {
  user: User;
  reaction: string;
  timestamp: number;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: number;
  room: string;
  reactions?: Reaction[];
  isVoiceMessage?: boolean;
  voiceUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  isGroup?: boolean;
  groupCode?: string;
  createdBy?: string;
  privateCode?: string; // Add private code property
}

export interface FriendRequest {
  id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate a group code
export const generateGroupCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Format timestamp in a friendly way
export const formatTimestamp = (timestamp: number): string => {
  return formatDistanceToNow(timestamp, { addSuffix: true });
};

// Check if a message is from the current user
export const isOwnMessage = (message: Message, userId: string): boolean => {
  return message.sender.id === userId;
};

// Get a greeting based on the time of day
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Create a guest user
export const createGuestUser = (name: string): User => {
  return {
    id: 'guest-' + generateId(),
    name: name || 'Guest User',
    email: 'guest@verbo.chat',
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`,
    online: true,
    isGuest: true
  };
};
