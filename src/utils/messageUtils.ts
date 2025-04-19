
import { v4 as uuidv4 } from 'uuid';

// User type
export interface User {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  online?: boolean;
  lastSeen?: number;
  isGuest?: boolean;
  lastActive?: number;
}

// Message type
export interface Message {
  id: string;
  content: string;
  sender: User;
  room: string;
  timestamp: number;
  reactions?: Reaction[];
  isVoiceMessage?: boolean;
  voiceUrl?: string;
  voiceMessage?: {
    audioUrl: string;
    duration: number;
  };
}

// Reaction type
export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

// Room type
export interface Room {
  id: string;
  name: string;
  createdBy: string;
  users: User[];
  createdAt: number;
}

// Create guest user
export const createGuestUser = (name: string): User => {
  return {
    id: `guest-${generateId()}`,
    name,
    email: `guest@verbo.chat`,
    photoURL: `https://api.dicebear.com/7.x/personas/svg?seed=${name}`,
    online: true,
    isGuest: true,
    lastActive: Date.now(),
    lastSeen: Date.now()
  };
};

// Get greeting based on time of day
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Format timestamp to human-readable time
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // If less than a minute ago
  if (diff < 60 * 1000) {
    return 'Just now';
  }
  
  // If less than an hour ago
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // If today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise, show full date
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Check if message is from current user
export const isOwnMessage = (message: Message, currentUser: User | null): boolean => {
  if (!currentUser) return false;
  return message.sender.id === currentUser.id;
};

// Generate random group code
export const generateGroupCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Generate random ID
export const generateId = (): string => {
  return uuidv4();
};
