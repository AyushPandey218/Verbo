import { useState, useEffect, useRef, useCallback } from 'react';
import SocketService from '@/utils/socketService';
import { User, Message, generateId } from '@/utils/messageUtils';
import { useToast } from '@/components/ui/use-toast';
import { SOCKET_SERVER_URL, DEBUG_SOCKET_EVENTS } from '@/utils/config';
import { isOffline } from '@/utils/socket';

interface UseSocketProps {
  user: User;
  roomName?: string;
}

export interface UseSocketReturn {
  messages: Message[];
  sendMessage: (content: string, user: User, roomName: string, voiceData?: any) => void;
  sendVoiceMessage: (blob: Blob, audioUrl: string) => void;
  sendWhiteboardData: (data: any) => void;
  onlineUsers: User[];
  matchedUser: User | null;
  privateRoomCode: string | null;
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  isRandomChat: boolean;
  isWaitingForMatch: boolean;
  currentRoom: string | null;
  sendPoll: (pollData: any) => void;
  votePoll: (pollId: string, optionId: string) => void;
  addReaction: (messageId: string, reaction: string, user: User) => void;
  saveDrawing: (imageUrl: string) => void;
  whiteboardData: string | undefined;
  joinRoom: (roomName: string, user: User) => void;
  leaveRoom: (roomName: string, user: User) => void;
  offlineMode: boolean;
}

export const useSocket = ({ user, roomName = 'general' }: UseSocketProps): UseSocketReturn => {
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
  const [isRandomChat, setIsRandomChat] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(roomName || null);
  const [whiteboardData, setWhiteboardData] = useState<string | undefined>(undefined);
  
  const [offlineMode, setOfflineMode] = useState(isOffline());
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = useRef(10);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Extract room code from room name if it's a private room
  useEffect(() => {
    if (roomName && roomName.startsWith('private-')) {
      const parts = roomName.split('-');
      if (parts.length >= 2) {
        setPrivateRoomCode(parts[1]);
      }
    } else {
      setPrivateRoomCode(null);
    }
  }, [roomName]);

  // Connect to socket server with improved error handling
  useEffect(() => {
    if (!user) return;
    
    // Check offline mode first
    if (isOffline()) {
      setOfflineMode(true);
      setConnected(false);
      setReconnecting(false);
      setError("You are in offline mode");
      console.log("Starting in offline mode");
      
      // If we're in offline mode, we still need to set up a socket instance (dummy)
      const socketService = SocketService.getInstance();
      setSocket(socketService.getSocket());
      
      return;
    }
    
    const connectSocket = async () => {
      try {
        setReconnecting(true);
        console.log('Connecting to socket service...');
        
        const socketService = SocketService.getInstance();
        const socketInstance = await socketService.connect();
        
        if (!socketInstance) {
          throw new Error('Failed to initialize socket service');
        }
        
        // Check if we switched to offline mode during connection
        if (isOffline()) {
          setOfflineMode(true);
          setConnected(false);
          setReconnecting(false);
          setError("You are in offline mode");
          return;
        }
        
        setSocket(socketInstance);
        setConnected(true);
        setReconnecting(false);
        setError(null);
        reconnectAttempts.current = 0;
        
        console.log('Socket connection established successfully');
        
        // Auto-join room if specified
        if (roomName) {
          console.log(`Auto-joining room: ${roomName}`);
          joinRoom(roomName, user);
        }
      } catch (err: any) {
        console.error('Socket connection error:', err);
        
        // Check if we're in offline mode
        if (isOffline()) {
          setOfflineMode(true);
          setConnected(false);
          setReconnecting(false);
          setError("You are in offline mode");
          return;
        }
        
        setConnected(false);
        setError(err.message || 'Failed to connect to chat service');
        
        // Implement reconnection logic with exponential backoff
        reconnectAttempts.current += 1;
        
        if (reconnectAttempts.current <= maxReconnectAttempts.current) {
          setReconnecting(true);
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts.current})`);
          
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
          }
          
          reconnectTimer.current = setTimeout(() => {
            connectSocket();
          }, delay);
        } else {
          setReconnecting(false);
          setError('Failed to connect after multiple attempts. Please refresh the page or enable offline mode.');
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Unable to establish a secure connection. You can continue in offline mode with limited functionality.",
          });
        }
      }
    };
    
    // Check for online status changes
    const handleOnlineStatusChange = () => {
      setOfflineMode(isOffline());
      if (!isOffline() && !connected && !reconnecting) {
        // We're back online, try to connect
        reconnectAttempts.current = 0;
        connectSocket();
      }
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    connectSocket();
    
    return () => {
      // Remove event listeners
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      
      // Clean up reconnection timer
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      
      // Disconnect socket
      if (socket) {
        const socketService = SocketService.getInstance();
        socketService.disconnect();
      }
    };
  }, [user, roomName, toast]);

  // Function to join a room
  const joinRoom = useCallback((roomName: string, user: User) => {
    if (!socket) {
      console.error('Cannot join room: socket not connected');
      return;
    }
    
    console.log(`Joining room: ${roomName} as ${user.name}`);
    setCurrentRoom(roomName);
    
    // For Firebase implementation, use the appropriate method
    if (socket.joinRoom && typeof socket.joinRoom === 'function') {
      socket.joinRoom(roomName, user);
    }
    
    if (roomName === 'random') {
      console.log('Finding random match');
      if (socket.findRandomMatch && typeof socket.findRandomMatch === 'function') {
        socket.findRandomMatch(user);
      }
      setIsWaitingForMatch(true);
      setIsRandomChat(true);
    } else {
      setIsWaitingForMatch(false);
      setIsRandomChat(false);
    }
  }, [socket]);

  // Function to leave a room
  const leaveRoom = useCallback((roomName: string, user: User) => {
    if (!socket) return;
    
    console.log(`Leaving room: ${roomName}`);
    setCurrentRoom(null);
    setMessages([]);
    
    // For Firebase implementation, use the appropriate method
    if (socket.leaveRoom && typeof socket.leaveRoom === 'function') {
      socket.leaveRoom(roomName, user);
    }
    
    if (roomName === 'random') {
      setIsWaitingForMatch(false);
      setMatchedUser(null);
      setIsRandomChat(false);
    }
  }, [socket]);

  const sendMessage = useCallback((content: string, user: User, roomName: string, voiceData?: any) => {
    if (!socket || !content.trim()) return;
    
    const message: Message = {
      id: generateId(),
      content,
      sender: user,
      room: roomName,
      timestamp: Date.now(),
      reactions: []
    };
    
    if (voiceData && voiceData.isVoiceMessage) {
      message.isVoiceMessage = true;
      message.voiceUrl = voiceData.audioUrl;
    }
    
    if (DEBUG_SOCKET_EVENTS) console.log('Sending message:', message);
    
    if (socket.sendMessage && typeof socket.sendMessage === 'function') {
      socket.sendMessage(message);
    }
    
    setMessages(prev => [...prev, message]);
  }, [socket]);

  // Function to send voice messages
  const sendVoiceMessage = useCallback((blob: Blob, audioUrl: string) => {
    if (!socket) return;
    
    const message: Message = {
      id: generateId(),
      content: "Voice message",
      sender: user,
      room: roomName,
      timestamp: Date.now(),
      isVoiceMessage: true,
      voiceUrl: audioUrl,
      reactions: []
    };
    
    if (DEBUG_SOCKET_EVENTS) console.log('Sending voice message:', message);
    
    if (socket.sendVoiceMessage && typeof socket.sendVoiceMessage === 'function') {
      socket.sendVoiceMessage(message);
    }
    
    setMessages(prev => [...prev, message]);
  }, [socket]);

  // Function to send whiteboard data
  const sendWhiteboardData = useCallback((data: any) => {
    if (!socket) return;
    
    const whiteboardDataObj = {
      data,
      room: roomName,
      sender: user.id
    };
    
    if (socket.updateWhiteboardData && typeof socket.updateWhiteboardData === 'function') {
      socket.updateWhiteboardData(roomName, user.id, data);
    }
  }, [socket]);

  // Function to save drawing as image message
  const saveDrawing = useCallback((imageUrl: string) => {
    if (!socket) return;
    
    const message: Message = {
      id: generateId(),
      content: "[sticker]" + imageUrl + "[/sticker]",
      sender: user,
      room: roomName,
      timestamp: Date.now(),
      reactions: []
    };
    
    if (socket.sendMessage && typeof socket.sendMessage === 'function') {
      socket.sendMessage(message);
    }
    
    toast({
      description: "Drawing saved to chat!",
      duration: 3000,
    });
  }, [socket, user, roomName, toast]);

  // Function to create a poll
  const sendPoll = useCallback((pollData: any) => {
    if (!socket) return;
    
    // Add missing fields
    const poll = {
      ...pollData,
      id: generateId(),
      createdAt: Date.now(),
    };
    
    // Convert to special message format
    const message: Message = {
      id: generateId(),
      content: `__POLL__:${JSON.stringify(poll)}`,
      sender: user,
      room: roomName,
      timestamp: Date.now(),
      reactions: []
    };
    
    if (DEBUG_SOCKET_EVENTS) console.log('Sending poll:', message);
    
    if (socket.sendMessage && typeof socket.sendMessage === 'function') {
      socket.sendMessage(message);
    }
    
    setMessages(prev => [...prev, message]);
  }, [socket, user, roomName]);

  // Function to vote on a poll
  const votePoll = useCallback((pollId: string, optionId: string) => {
    if (!socket) return;
    
    const voteData = {
      pollId,
      optionId,
      user,
      room: roomName,
      timestamp: Date.now()
    };
    
    if (DEBUG_SOCKET_EVENTS) console.log('Sending poll vote:', voteData);
    
    if (socket.votePoll && typeof socket.votePoll === 'function') {
      socket.votePoll(pollId, optionId, user.id, roomName);
    }
    
    // Optimistically update UI
    setMessages(prevMessages => {
      return prevMessages.map(message => {
        if (message.content?.startsWith('__POLL__:')) {
          try {
            const pollString = message.content.replace('__POLL__:', '');
            const poll = JSON.parse(pollString);
            
            if (poll.id === pollId) {
              // Update the poll with the new vote
              const updatedOptions = poll.options.map((option: any) => {
                if (option.id === optionId) {
                  const votes = option.votes || [];
                  // Only add vote if user hasn't voted for this option
                  if (!votes.some((v: any) => v.userId === user.id)) {
                    return {
                      ...option,
                      votes: [...votes, { userId: user.id, timestamp: Date.now() }]
                    };
                  }
                }
                return option;
              });
              
              const updatedPoll = { ...poll, options: updatedOptions };
              return { ...message, content: `__POLL__:${JSON.stringify(updatedPoll)}` };
            }
          } catch (e) {
            console.error('Error updating poll vote:', e);
          }
        }
        return message;
      });
    });
  }, [socket, user, roomName]);

  // Function to add reaction to a message
  const addReaction = useCallback((messageId: string, reaction: string, user: User) => {
    if (!socket) return;
    
    const reactionData = {
      messageId,
      reaction,
      user,
      room: currentRoom,
      timestamp: Date.now()
    };
    
    if (DEBUG_SOCKET_EVENTS) console.log('Adding reaction:', reactionData);
    
    // For Firebase implementation, use the appropriate method
    if (socket.addReaction && typeof socket.addReaction === 'function') {
      socket.addReaction(messageId, reaction, user, currentRoom || 'general');
    }
    
    // Optimistically update UI
    setMessages(prevMessages => {
      return prevMessages.map(message => {
        if (message.id === messageId) {
          const updatedMessage = { ...message };
          
          if (!updatedMessage.reactions) {
            updatedMessage.reactions = [];
          }
          
          updatedMessage.reactions.push({
            emoji: reaction,
            userId: user.id,
            userName: user.name
          });
          
          return updatedMessage;
        }
        return message;
      });
    });
  }, [socket, currentRoom]);

  return {
    messages,
    sendMessage,
    sendVoiceMessage,
    sendWhiteboardData,
    onlineUsers,
    matchedUser,
    privateRoomCode,
    connected,
    reconnecting,
    error,
    isRandomChat,
    isWaitingForMatch,
    currentRoom,
    sendPoll,
    votePoll,
    addReaction,
    saveDrawing,
    whiteboardData,
    joinRoom,
    leaveRoom,
    offlineMode,
  };
};
