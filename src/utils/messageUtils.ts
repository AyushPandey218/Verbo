export interface User {
  inRandomChat: any;
  id: string;
  name: string;
  email: string;
  photoURL: string;
  online: boolean;
  isGuest: boolean;
  lastActive?: number;
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
