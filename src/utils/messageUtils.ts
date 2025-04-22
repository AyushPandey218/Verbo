export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  online: boolean;
  isGuest: boolean;
  lastActive?: number;
  inRandomChat?: boolean;
  searchingForMatch?: boolean; // New property to track if user is searching for a match
}

export interface Room {
  id: string;
  name: string;
  description: string;
  owner: User;
  createdAt: number;
  isPrivate: boolean;
  code?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: number;
  room: string;
  reactions: Reaction[];
  isVoiceMessage?: boolean;
  voiceUrl?: string;
  isDrawing?: boolean;
  drawingUrl?: string;
}

export interface Reaction {
  reaction: string;
  user: User;
  timestamp: number;
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};

// Helper function to check if a room is a private room
export const isPrivateRoom = (roomName: string): boolean => {
  return roomName.startsWith('private-');
};

// Helper function to extract the private room code from a room name
export const extractPrivateRoomCode = (roomName: string): string | null => {
  if (!isPrivateRoom(roomName)) return null;
  
  // Format is 'private-CODE-roomname' so get the second segment
  const parts = roomName.split('-');
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
};

// Add the generateGroupCode function that's missing
export function generateGroupCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Add missing functions referenced in build errors

// Create a guest user
export function createGuestUser(name: string): User {
  return {
    id: 'guest-' + Date.now(),
    name,
    email: '',
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    online: true,
    lastActive: Date.now(),
    isGuest: true
  };
}

// Format timestamp 
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay}d ago`;
  } else if (diffHour > 0) {
    return `${diffHour}h ago`;
  } else if (diffMin > 0) {
    return `${diffMin}m ago`;
  } else {
    return 'just now';
  }
}

// Check if message is from current user
export function isOwnMessage(message: any, currentUserId: string): boolean {
  return message.sender?.id === currentUserId;
}
