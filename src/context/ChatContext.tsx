
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Message, Room } from '@/utils/messageUtils';
import { getSocket, disconnectSocket } from '@/utils/socket';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { isPrivateRoom, extractPrivateRoomCode } from '@/utils/config';

interface ChatContextProps {
  currentUser: User | null;
  currentRoom: string | null;
  messages: Message[];
  onlineUsers: User[];
  connected: boolean;
  reconnecting: boolean;
  connectionError: string | null;
  matchedUser: User | null;
  isRandomChat: boolean;
  privateRoomCode: string | null;
  groups: Room[];
  friends: User[];
  whiteboardData: string | undefined;
  setCurrentUser: (user: User | null) => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
  sendVoiceMessage: (blob: Blob, audioUrl: string) => void;
  addReaction: (messageId: string, reaction: string) => void;
  createGroup: (name: string) => void;
  joinGroup: (code: string) => void;
  addFriend: (email: string) => void;
  sendWhiteboardData: (data: any) => void;
  sendPoll: (pollData: any) => void;
  votePoll: (pollId: string, optionId: string) => void;
  signOut: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [isRandomChat, setIsRandomChat] = useState<boolean>(false);
  const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
  const [groups, setGroups] = useState<Room[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [whiteboardData, setWhiteboardData] = useState<string | undefined>(undefined);
  
  const socket = useRef(getSocket());
  const { toast } = useToast();
  
  // Initialize connection and event listeners
  useEffect(() => {
    const socketInstance = socket.current;
    
    const handleConnect = () => {
      console.log('Socket.io connected');
      setConnected(true);
      setReconnecting(false);
      setConnectionError(null);
      
      // If user and room are already set (from localStorage), re-join room
      if (currentUser && currentRoom) {
        socketInstance.emit('login', currentUser);
        socketInstance.emit('join_room', { roomName: currentRoom, user: currentUser });
      }
    };
    
    const handleDisconnect = (reason: string) => {
      console.log('Socket.io disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        setReconnecting(true);
        socketInstance.connect();
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        setReconnecting(true);
      }
    };
    
    const handleConnectError = (error: Error) => {
      console.error('Socket.io connection error:', error);
      setConnected(false);
      setReconnecting(false);
      setConnectionError(error.message || 'Failed to connect to chat server');
    };
    
    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`Socket.io reconnect attempt: ${attemptNumber}`);
      setReconnecting(true);
    };
    
    const handleReconnectFailed = () => {
      console.log('Socket.io reconnect failed');
      setReconnecting(false);
      setConnectionError('Could not reconnect to chat server after multiple attempts');
    };
    
    const handleChatMessage = (message: Message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
    };
    
    const handleUserList = (users: User[]) => {
      console.log('Received user list:', users);
      setOnlineUsers(users);
    };
    
    const handleRoomUsers = (users: User[]) => {
      console.log('Received room users:', users);
      setOnlineUsers(users);
    };
    
    const handleUserOnline = (user: User) => {
      console.log('User online:', user);
      setOnlineUsers(prev => {
        if (!prev.find(u => u.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
    };
    
    const handleUserOffline = ({ userId, lastSeen }: { userId: string, lastSeen: number }) => {
      console.log('User offline:', userId);
      setOnlineUsers(prev => prev.filter(user => user.id !== userId));
    };
    
    const handleRandomMatchFound = ({ matchedUser, privateRoom }: { matchedUser: User, privateRoom: string }) => {
      console.log('Random match found:', matchedUser, privateRoom);
      setMatchedUser(matchedUser);
      setIsRandomChat(true);
      setCurrentRoom(privateRoom);
      setMessages([]);
      
      // Join the private room
      socketInstance.emit('join_room', { roomName: privateRoom, user: currentUser });
      
      toast({
        title: "Match found!",
        description: `You've been matched with ${matchedUser.name}`,
        duration: 5000,
      });
    };
    
    const handleWaitingForMatch = () => {
      toast({
        description: "Waiting for a match... Please wait.",
        duration: 3000,
      });
    };
    
    const handleRandomMatchEnded = () => {
      toast({
        description: "Your match has ended the chat.",
        duration: 3000,
      });
      
      // Go back to lobby
      setCurrentRoom(null);
      setMatchedUser(null);
      setIsRandomChat(false);
      setMessages([]);
    };
    
    const handleWhiteboardData = ({ data, sender }: { data: string, sender: User }) => {
      console.log('Received whiteboard data from:', sender.name);
      setWhiteboardData(data);
    };
    
    const handleReactionAdded = ({ messageId, reaction, user }: { messageId: string, reaction: string, user: User }) => {
      console.log('Reaction added:', messageId, reaction, user);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                reactions: [...(msg.reactions || []), { emoji: reaction, userId: user.id, userName: user.name }]
              }
            : msg
        )
      );
    };
    
    const handlePollVote = (voteData: any) => {
      console.log('Poll vote received:', voteData);
      // Find the poll message and update its data
      setMessages(prev => 
        prev.map(msg => {
          if (msg.id === voteData.pollId) {
            try {
              const pollContent = msg.content?.replace('__POLL__:', '');
              if (pollContent) {
                const pollData = JSON.parse(pollContent);
                
                // Update the options with the new vote
                const updatedOptions = pollData.options.map((option: any) => {
                  if (option.id === voteData.optionId) {
                    return {
                      ...option,
                      votes: [...(option.votes || []), voteData.userId]
                    };
                  }
                  return option;
                });
                
                // Create updated poll data
                const updatedPollData = {
                  ...pollData,
                  options: updatedOptions
                };
                
                // Create updated message with the new poll data
                return {
                  ...msg,
                  content: `__POLL__:${JSON.stringify(updatedPollData)}`
                };
              }
            } catch (e) {
              console.error('Error updating poll votes:', e);
            }
          }
          return msg;
        })
      );
    };
    
    // Set up event listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('reconnect_attempt', handleReconnectAttempt);
    socketInstance.on('reconnect_failed', handleReconnectFailed);
    socketInstance.on('chat message', handleChatMessage);
    socketInstance.on('userList', handleUserList);
    socketInstance.on('room_users', handleRoomUsers);
    socketInstance.on('userOnline', handleUserOnline);
    socketInstance.on('userOffline', handleUserOffline);
    socketInstance.on('random_match_found', handleRandomMatchFound);
    socketInstance.on('waiting_for_match', handleWaitingForMatch);
    socketInstance.on('random_match_ended', handleRandomMatchEnded);
    socketInstance.on('whiteboard_data', handleWhiteboardData);
    socketInstance.on('reaction_added', handleReactionAdded);
    socketInstance.on('poll_vote', handlePollVote);
    
    // Check connection status immediately
    setConnected(socketInstance.connected);
    
    // Clean up event listeners
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('reconnect_attempt', handleReconnectAttempt);
      socketInstance.off('reconnect_failed', handleReconnectFailed);
      socketInstance.off('chat message', handleChatMessage);
      socketInstance.off('userList', handleUserList);
      socketInstance.off('room_users', handleRoomUsers);
      socketInstance.off('userOnline', handleUserOnline);
      socketInstance.off('userOffline', handleUserOffline);
      socketInstance.off('random_match_found', handleRandomMatchFound);
      socketInstance.off('waiting_for_match', handleWaitingForMatch);
      socketInstance.off('random_match_ended', handleRandomMatchEnded);
      socketInstance.off('whiteboard_data', handleWhiteboardData);
      socketInstance.off('reaction_added', handleReactionAdded);
      socketInstance.off('poll_vote', handlePollVote);
    };
  }, [currentUser, currentRoom, toast]);
  
  // Join room function
  const joinRoom = (roomName: string) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to join a room",
        duration: 3000,
      });
      return;
    }
    
    // Reset state
    setMessages([]);
    setOnlineUsers([]);
    setMatchedUser(null);
    setIsRandomChat(false);
    setPrivateRoomCode(null);
    
    // Handle special cases for room names
    if (roomName === 'random') {
      console.log('Finding random match...');
      socket.current.emit('find_random_match', { user: currentUser });
      setIsRandomChat(true);
      return;
    }
    
    // Check if this is a private room and extract the code
    if (isPrivateRoom(roomName)) {
      const code = extractPrivateRoomCode(roomName);
      setPrivateRoomCode(code);
    }
    
    console.log(`Joining room: ${roomName}`);
    setCurrentRoom(roomName);
    
    // Emit join_room event
    socket.current.emit('join_room', { roomName, user: currentUser });
    
    // Save current room to localStorage
    localStorage.setItem('currentRoom', roomName);
  };
  
  // Leave room function
  const leaveRoom = () => {
    if (currentRoom) {
      console.log(`Leaving room: ${currentRoom}`);
      socket.current.emit('leave_room', { roomName: currentRoom, user: currentUser });
      
      setCurrentRoom(null);
      setMessages([]);
      setOnlineUsers([]);
      setMatchedUser(null);
      setIsRandomChat(false);
      setPrivateRoomCode(null);
      
      // Remove current room from localStorage
      localStorage.removeItem('currentRoom');
    }
  };
  
  // Send message function
  const sendMessage = (content: string) => {
    if (!currentUser || !currentRoom) return;
    
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    const message: Message = {
      id: messageId,
      content,
      sender: currentUser,
      room: currentRoom,
      timestamp,
      reactions: [],
    };
    
    console.log('Sending message:', message);
    socket.current.emit('message', message);
  };
  
  // Send voice message function
  const sendVoiceMessage = (blob: Blob, audioUrl: string) => {
    if (!currentUser || !currentRoom) return;
    
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    const message: Message = {
      id: messageId,
      content: '',
      sender: currentUser,
      room: currentRoom,
      timestamp,
      reactions: [],
      isVoiceMessage: true,
      voiceUrl: audioUrl,
    };
    
    console.log('Sending voice message:', message);
    socket.current.emit('voice_message', message);
  };
  
  // Add reaction function
  const addReaction = (messageId: string, reaction: string) => {
    if (!currentUser || !currentRoom) return;
    
    console.log('Adding reaction:', messageId, reaction);
    
    socket.current.emit('add_reaction', {
      messageId,
      reaction,
      user: currentUser,
      room: currentRoom,
    });
  };
  
  // Create group function
  const createGroup = (name: string) => {
    if (!currentUser) return;
    
    const group: Room = {
      id: `group-${uuidv4()}`,
      name,
      createdBy: currentUser.id,
      users: [currentUser],
      createdAt: Date.now(),
    };
    
    console.log('Creating group:', group);
    setGroups(prev => [...prev, group]);
    
    // In a real implementation, this would be sent to the server
    // For now, we'll just join the group
    joinRoom(group.id);
  };
  
  // Join group function
  const joinGroup = (code: string) => {
    if (!currentUser) return;
    
    console.log('Joining group with code:', code);
    
    // In a real implementation, this would validate the code with the server
    // For now, we'll just join a room with the code as ID
    joinRoom(`private-${code}`);
  };
  
  // Add friend function
  const addFriend = (email: string) => {
    if (!currentUser) return;
    
    console.log('Adding friend with email:', email);
    
    // In a real implementation, this would send a friend request to the server
    // For now, we'll just show a toast
    toast({
      title: "Friend request sent",
      description: `A friend request has been sent to ${email}`,
      duration: 3000,
    });
  };
  
  // Send whiteboard data function
  const sendWhiteboardData = (data: any) => {
    if (!currentUser || !currentRoom) return;
    
    console.log('Sending whiteboard data');
    
    socket.current.emit('whiteboard_data', {
      data,
      room: currentRoom,
      sender: currentUser,
    });
  };
  
  // Send poll function
  const sendPoll = (pollData: any) => {
    if (!currentUser || !currentRoom) return;
    
    const messageId = uuidv4();
    const timestamp = Date.now();
    
    // Add missing properties to poll data
    const completePollData = {
      ...pollData,
      id: messageId,
      createdAt: timestamp,
    };
    
    // Create a message with poll data
    const message: Message = {
      id: messageId,
      content: `__POLL__:${JSON.stringify(completePollData)}`,
      sender: currentUser,
      room: currentRoom,
      timestamp,
      reactions: [],
    };
    
    console.log('Sending poll:', message);
    socket.current.emit('message', message);
  };
  
  // Vote on poll function
  const votePoll = (pollId: string, optionId: string) => {
    if (!currentUser || !currentRoom) return;
    
    console.log('Voting on poll:', pollId, optionId);
    
    socket.current.emit('poll_vote', {
      pollId,
      optionId,
      userId: currentUser.id,
      userName: currentUser.name,
      room: currentRoom,
    });
  };
  
  // Sign out function
  const signOut = () => {
    if (currentRoom) {
      socket.current.emit('leave_room', { roomName: currentRoom, user: currentUser });
    }
    
    // Disconnect socket
    disconnectSocket();
    
    // Reset state
    setCurrentUser(null);
    setCurrentRoom(null);
    setMessages([]);
    setOnlineUsers([]);
    setMatchedUser(null);
    setIsRandomChat(false);
    setPrivateRoomCode(null);
    setGroups([]);
    setFriends([]);
    
    // Clear localStorage
    localStorage.removeItem('chatUser');
    localStorage.removeItem('currentRoom');
    
    // Reconnect socket for future use
    socket.current = getSocket();
  };
  
  // Restore user from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    const savedRoom = localStorage.getItem('currentRoom');
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        // Log in to socket server
        socket.current.emit('login', user);
        
        // Join room if available
        if (savedRoom) {
          setCurrentRoom(savedRoom);
          socket.current.emit('join_room', { roomName: savedRoom, user });
        }
      } catch (e) {
        console.error('Error restoring user from localStorage:', e);
        localStorage.removeItem('chatUser');
      }
    }
  }, []);
  
  // Debugging logs
  useEffect(() => {
    console.info('Current room state:', currentRoom);
    console.info('Online users:', onlineUsers);
    console.info('Current user:', currentUser);
    console.info('Current messages:', messages);
    
    if (currentRoom) {
      console.info('About to render based on currentRoom:', currentRoom);
    }
  }, [currentRoom, onlineUsers, currentUser, messages]);
  
  const value = {
    currentUser,
    currentRoom,
    messages,
    onlineUsers,
    connected,
    reconnecting,
    connectionError,
    matchedUser,
    isRandomChat,
    privateRoomCode,
    groups,
    friends,
    whiteboardData,
    setCurrentUser,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendVoiceMessage,
    addReaction,
    createGroup,
    joinGroup,
    addFriend,
    sendWhiteboardData,
    sendPoll,
    votePoll,
    signOut,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
