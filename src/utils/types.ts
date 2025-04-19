export interface User {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  online?: boolean;
  socketId?: string;
  lastSeen?: number;
  leftAt?: number;
  joinedAt?: number;
  isGuest?: boolean;
  lastActive?: number;
  gender?: 'male' | 'female' | 'other';
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

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
  user?: User;
  reaction?: string;
  timestamp?: number;
}

export interface Room {
  id: string;
  name: string;
  members: string[];
  isGroup?: boolean;
  createdBy?: string;
  lastActivity?: number;
}

export interface UserStatus {
  userId: string;
  typing: boolean;
  lastTyping: number;
  room?: string;
}
