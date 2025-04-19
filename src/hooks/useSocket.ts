
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message, generateId } from '@/utils/messageUtils';
import { useToast } from '@/components/ui/use-toast';
import { SOCKET_SERVER_URL, DEBUG_SOCKET_EVENTS } from '@/utils/config';

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
}

export const useSocket = ({ user, roomName = 'general' }: UseSocketProps): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
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
  
  const reconnectAttempts = useRef(0);
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

  // Connect to socket server
  useEffect(() => {
    if (!user) return;
    
    try {
      console.log('Connecting to socket server at:', SOCKET_SERVER_URL);
      const newSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      setSocket(newSocket);
      setReconnecting(false);
      
      return () => {
        if (newSocket) {
          console.log('Disconnecting socket');
          newSocket.disconnect();
        }
      };
    } catch (err) {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat server');
      setConnected(false);
    }
  }, [user]);

  // Function to join a room
  const joinRoom = useCallback((roomName: string, user: User) => {
    if (!socket || !connected) {
      console.error('Cannot join room: socket not connected');
      return;
    }
    
    console.log(`Joining room: ${roomName} as ${user.name}`);
    socket.emit('join_room', { roomName, user });
    setCurrentRoom(roomName);
    
    if (roomName === 'random') {
      console.log('Finding random match');
      socket.emit('find_random_match', { user });
      setIsWaitingForMatch(true);
      setIsRandomChat(true);
    } else {
      setIsWaitingForMatch(false);
      setIsRandomChat(false);
    }
  }, [socket, connected]);

  // Function to leave a room
  const leaveRoom = useCallback((roomName: string, user: User) => {
    if (!socket || !connected) return;
    
    console.log(`Leaving room: ${roomName}`);
    socket.emit('leave_room', { roomName, user });
    setCurrentRoom(null);
    setMessages([]);
    
    if (roomName === 'random') {
      setIsWaitingForMatch(false);
      setMatchedUser(null);
      setIsRandomChat(false);
    }
  }, [socket, connected]);

  // Handle socket connection events
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('Socket connected!');
      setConnected(true);
      setReconnecting(false);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Login with user info after connection
      socket.emit('login', user);
      
      if (roomName) {
        console.log(`Auto-joining room: ${roomName}`);
        socket.emit('join_room', { roomName, user });
        
        if (roomName === 'random') {
          console.log('Looking for random match');
          socket.emit('find_random_match', { user });
          setIsWaitingForMatch(true);
          setIsRandomChat(true);
        } else {
          setIsWaitingForMatch(false);
          setIsRandomChat(false);
        }
      }
    };

    const onDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setReconnecting(true);
        
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current <= 5) {
          console.log(`Reconnect attempt ${reconnectAttempts.current}`);
          socket.connect();
        } else {
          setReconnecting(false);
          setError('Connection to server lost. Please refresh the page.');
        }
      }
    };

    const onConnectError = (err: Error) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
      
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current <= 5) {
        setReconnecting(true);
      } else {
        setReconnecting(false);
      }
    };

    // Register connection event handlers
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [socket, user, roomName]);

  // Handle real-time messages and events
  useEffect(() => {
    if (!socket || !connected) return;

    const handleChatMessage = (message: Message) => {
      if (DEBUG_SOCKET_EVENTS) console.log('Received chat message:', message);
      
      // Only add messages for the current room
      if (message.room === roomName) {
        setMessages(prevMessages => {
          // Check if message already exists
          if (prevMessages.some(m => m.id === message.id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      }
    };

    const handleVoiceMessage = (message: Message) => {
      if (DEBUG_SOCKET_EVENTS) console.log('Received voice message:', message);
      
      // Only add messages for the current room
      if (message.room === roomName) {
        setMessages(prevMessages => {
          // Check if message already exists
          if (prevMessages.some(m => m.id === message.id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      }
    };

    const handleUserList = (users: User[]) => {
      if (DEBUG_SOCKET_EVENTS) console.log('Received user list:', users);
      setOnlineUsers(users);
    };

    const handleRoomUsers = (users: User[]) => {
      if (DEBUG_SOCKET_EVENTS) console.log('Received room users:', users);
      setOnlineUsers(users);
    };

    const handleRandomMatchFound = (data: { matchedUser: User, privateRoom: string }) => {
      console.log('Random match found:', data);
      
      setMatchedUser(data.matchedUser);
      setIsRandomChat(true);
      
      // Switch to the private room
      socket.emit('leave_room', { roomName, user });
      socket.emit('join_room', { roomName: data.privateRoom, user });
      
      toast({
        title: 'Match Found!',
        description: `You are now chatting with ${data.matchedUser.name}`,
      });
    };

    const handleRandomMatchEnded = () => {
      console.log('Random match ended');
      toast({
        title: 'Chat Ended',
        description: 'The other person has left the chat',
      });
    };

    const handleWaitingForMatch = () => {
      console.log('Waiting for a match...');
      setIsWaitingForMatch(true);
      toast({
        title: 'Finding a match...',
        description: 'Please wait while we find someone for you to chat with',
      });
    };

    const handleReactionAdded = (data: { messageId: string, reaction: string, user: User }) => {
      if (DEBUG_SOCKET_EVENTS) console.log('Reaction added:', data);
      
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.id === data.messageId) {
            const updatedMessage = { ...message };
            
            if (!updatedMessage.reactions) {
              updatedMessage.reactions = [];
            }
            
            updatedMessage.reactions.push({
              user: data.user,
              reaction: data.reaction,
              timestamp: Date.now() // Adding timestamp here
            });
            
            return updatedMessage;
          }
          return message;
        });
      });
    };

    const handleWhiteboardData = (data: { data: string }) => {
      if (DEBUG_SOCKET_EVENTS) console.log('Received whiteboard data');
      setWhiteboardData(data.data);
    };

    // Chat and message event handlers
    socket.on('chat message', handleChatMessage);
    socket.on('voice_message', handleVoiceMessage);
    socket.on('userList', handleUserList);
    socket.on('room_users', handleRoomUsers);
    socket.on('random_match_found', handleRandomMatchFound);
    socket.on('random_match_ended', handleRandomMatchEnded);
    socket.on('waiting_for_match', handleWaitingForMatch);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('whiteboard_data', handleWhiteboardData);
    socket.on('message_received', handleChatMessage); // Added this to make sure messages are received

    return () => {
      socket.off('chat message', handleChatMessage);
      socket.off('voice_message', handleVoiceMessage);
      socket.off('userList', handleUserList);
      socket.off('room_users', handleRoomUsers);
      socket.off('random_match_found', handleRandomMatchFound);
      socket.off('random_match_ended', handleRandomMatchEnded);
      socket.off('waiting_for_match', handleWaitingForMatch);
      socket.off('reaction_added', handleReactionAdded);
      socket.off('whiteboard_data', handleWhiteboardData);
      socket.off('message_received', handleChatMessage);
    };
  }, [socket, connected, roomName, toast]);

  // Function to send text messages
  const sendMessage = useCallback((content: string, user: User, roomName: string, voiceData?: any) => {
    if (!socket || !connected || !content.trim()) return;
    
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
    
    // Send to socket server
    socket.emit('message', message);
    socket.emit('send_message', message); // Add this to ensure messages are sent correctly
    
    // Optimistically add to local messages
    setMessages(prev => [...prev, message]);
  }, [socket, connected]);

  // Function to send voice messages
  const sendVoiceMessage = useCallback((blob: Blob, audioUrl: string) => {
    if (!socket || !connected) return;
    
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
    
    // Send to socket server
    socket.emit('voice_message', message);
    
    // Optimistically add to local messages
    setMessages(prev => [...prev, message]);
  }, [socket, connected]);

  // Function to send whiteboard data
  const sendWhiteboardData = useCallback((data: any) => {
    if (!socket || !connected) return;
    
    const whiteboardDataObj = {
      data,
      room: roomName,
      sender: user.id
    };
    
    socket.emit('whiteboard_data', whiteboardDataObj);
  }, [socket, connected]);

  // Function to save drawing as image message
  const saveDrawing = useCallback((imageUrl: string) => {
    if (!socket || !connected) return;
    
    const message: Message = {
      id: generateId(),
      content: "[sticker]" + imageUrl + "[/sticker]",
      sender: user,
      room: roomName,
      timestamp: Date.now(),
      reactions: []
    };
    
    // Send to socket server
    socket.emit('message', message);
    socket.emit('send_message', message); // Add this to ensure messages are sent
    
    // Optimistically add to local messages
    setMessages(prev => [...prev, message]);
    
    toast({
      description: "Drawing saved to chat!",
      duration: 3000,
    });
  }, [socket, connected, user, roomName, toast]);

  // Function to create a poll
  const sendPoll = useCallback((pollData: any) => {
    if (!socket || !connected) return;
    
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
    
    // Send to socket server
    socket.emit('message', message);
    socket.emit('send_message', message); // Add this to ensure messages are sent
    
    // Optimistically add to local messages
    setMessages(prev => [...prev, message]);
  }, [socket, connected, user, roomName]);

  // Function to vote on a poll
  const votePoll = useCallback((pollId: string, optionId: string) => {
    if (!socket || !connected) return;
    
    const voteData = {
      pollId,
      optionId,
      user,
      room: roomName,
      timestamp: Date.now()
    };
    
    if (DEBUG_SOCKET_EVENTS) console.log('Sending poll vote:', voteData);
    socket.emit('poll_vote', voteData);
    
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
  }, [socket, connected, user, roomName]);

  // Function to add reaction to a message
  const addReaction = useCallback((messageId: string, reaction: string, user: User) => {
    if (!socket || !connected) return;
    
    const reactionData = {
      messageId,
      reaction,
      user,
      room: currentRoom,
      timestamp: Date.now() // Adding timestamp here
    };
    
    if (DEBUG_SOCKET_EVENTS) console.log('Adding reaction:', reactionData);
    socket.emit('add_reaction', reactionData);
    
    // Optimistically update UI
    setMessages(prevMessages => {
      return prevMessages.map(message => {
        if (message.id === messageId) {
          const updatedMessage = { ...message };
          
          if (!updatedMessage.reactions) {
            updatedMessage.reactions = [];
          }
          
          updatedMessage.reactions.push({
            user,
            reaction,
            timestamp: Date.now() // Adding timestamp here
          });
          
          return updatedMessage;
        }
        return message;
      });
    });
  }, [socket, connected, currentRoom]);

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
    leaveRoom
  };
};
