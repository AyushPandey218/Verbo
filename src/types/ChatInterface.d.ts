
import { User, Message, Room } from '@/utils/messageUtils';
import { PollData } from '@/components/Poll';

export interface ChatInterfaceProps {
  user: User;
  messages: Message[];
  onlineUsers: User[];
  roomName: string;
  onSendMessage: (content: string) => void;
  onSendVoiceMessage: (blob: Blob, audioUrl: string) => void;
  onLeaveRoom: () => void;
  onSignOut: () => void;
  onAddReaction: (messageId: string, reaction: string) => void;
  onCreateGroup: (name: string) => void;
  onJoinGroup: (code: string) => void;
  onJoinGroupClick: (groupId: string) => void;
  onAddFriend: (email: string) => void;
  onSendWhiteboardData: (data: any) => void;
  onSendPoll: (pollData: Omit<PollData, 'id' | 'createdAt'>) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onBackToGreeting: () => void;
  groups: Room[];
  friends: User[];
  matchedUser: User | null;
  isRandomChat: boolean;
  whiteboardData: any;
  connected: boolean;
  privateRoomCode: string | null;
}
