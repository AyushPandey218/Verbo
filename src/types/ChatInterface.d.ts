
// If this file already exists, add/update these interfaces
import { User, Room } from "@/utils/messageUtils";

export type SentimentScore = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
}

export interface ChatInterfaceProps {
  user: User;
  messages: any[]; // Replace 'any' with more specific message type
  onlineUsers: User[];
  roomName: string;
  onSendMessage: (message: string) => void;
  onSendVoiceMessage?: (blob: Blob, audioUrl: string) => void;
  onLeaveRoom: () => void;
  onSignOut: () => void;
  onAddReaction: (messageId: string, reaction: string) => void;
  onCreateGroup: (name: string) => void;
  onJoinGroup: (code: string) => void;
  onJoinGroupClick: (groupId: string) => void;
  onAddFriend: (email: string) => void;
  onSendWhiteboardData: (data: any) => void;
  onSendPoll: (pollData: any) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  groups: Room[];
  friends: User[];
  matchedUser: User | null;
  isRandomChat: boolean;
  whiteboardData?: string;
  connected?: boolean;
  privateRoomCode?: string | null;
  onSaveDrawing?: (imageUrl: string) => void;
  onBackToGreeting?: () => void;
}
