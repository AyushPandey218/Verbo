import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message, generateId } from '@/utils/messageUtils';
import FirebaseService from '@/utils/firebaseService';
import { 
  socketServerUrl, 
  USE_MOCK_SOCKET_FALLBACK, 
  PREVENT_DUPLICATE_MESSAGES, 
  DUPLICATE_MESSAGE_WINDOW,
  POLL_DUPLICATE_WINDOW,
  USER_ONLINE_TIMEOUT,
  MESSAGE_HISTORY_WINDOW
} from '@/utils/config';
import { PollData } from '@/components/Poll';
import { createMockSocketService } from '@/utils/mockSocketService';

type WhiteboardData = {
  roomId: string;
  userId: string;
  drawingData: string;
};

export const useSocket = (initialUser: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState<string | undefined>(undefined);
  const [useMockSocket, setUseMockSocket] = useState(USE_MOCK_SOCKET_FALLBACK);

  const socketRef = useRef<Socket | null>(null);
  const mockSocketRef = useRef<any>(null);
  const firebaseServiceRef = useRef<FirebaseService>(FirebaseService.getInstance());
  const userRef = useRef<User | null>(initialUser);
  const roomRef = useRef<string | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const processedPollIds = useRef<Set<string>>(new Set());
  
  const cleanupListeners = useRef<(() => void)[]>([]);
  const initialRoomLoadComplete = useRef<boolean>(false);
  const initialLoadTimestamp = useRef<number>(0);
  const messageOperationInProgress = useRef<boolean>(false);
  const pollOperationInProgress = useRef<boolean>(false);

  const isDuplicateMessage = useCallback((messageId: string, isPoll: boolean = false): boolean => {
    if (!PREVENT_DUPLICATE_MESSAGES) return false;
    
    if (processedMessageIds.current.has(messageId)) {
      console.log(`Duplicate message detected: ${messageId}`);
      return true;
    }
    
    if (isPoll && processedPollIds.current.has(messageId)) {
      console.log(`Duplicate poll detected: ${messageId}`);
      return true;
    }
    
    processedMessageIds.current.add(messageId);
    
    setTimeout(() => {
      processedMessageIds.current.delete(messageId);
    }, isPoll ? POLL_DUPLICATE_WINDOW : DUPLICATE_MESSAGE_WINDOW);
    
    if (isPoll) {
      processedPollIds.current.add(messageId);
      setTimeout(() => {
        processedPollIds.current.delete(messageId);
      }, POLL_DUPLICATE_WINDOW);
    }
    
    return false;
  }, []);

  const filterRecentMessages = useCallback((messages: Message[]): Message[] => {
    const cutoffTime = Date.now() - MESSAGE_HISTORY_WINDOW;
    return messages.filter(msg => msg.timestamp >= cutoffTime);
  }, []);

  useEffect(() => {
    userRef.current = initialUser;
    
    if (initialUser) {
      console.log("User initialized in socket hook:", initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    console.log("Setting up socket connection");
    
    if (!initialUser) {
      console.log("No user, not setting up socket connection");
      return;
    }
    
    if (socketRef.current) {
      console.log("Cleaning up previous socket connection");
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
    }
    
    if (!useMockSocket) {
      try {
        console.log(`Connecting to socket server: ${socketServerUrl}`);
        socketRef.current = io(socketServerUrl, {
          transports: ['websocket', 'polling'],
          query: {
            userId: initialUser.id
          }
        });
        
        socketRef.current.on('connect', () => {
          console.log("Socket connected");
          setConnected(true);
          setError(null);
          
          firebaseServiceRef.current.loginUser(initialUser);
        });
        
        socketRef.current.on('disconnect', () => {
          console.log("Socket disconnected");
          setConnected(false);
        });
        
        socketRef.current.on('connect_error', (error) => {
          console.error("Socket connection error:", error);
          setError(`Connection error: ${error.message}`);
          setConnected(false);
          setReconnecting(true);
          
          setUseMockSocket(true);
        });
        
        socketRef.current.on('reconnect', (attemptNumber) => {
          console.log(`Socket reconnected after ${attemptNumber} attempts`);
          setConnected(true);
          setReconnecting(false);
          setError(null);
          
          if (roomRef.current && userRef.current) {
            console.log(`Auto-rejoining room ${roomRef.current}`);
            joinRoom(roomRef.current, userRef.current);
          }
        });
        
        socketRef.current.on('whiteboard_update', (data: WhiteboardData) => {
          console.log("Received whiteboard update from socket:", data.userId);
          
          if (data.userId !== userRef.current?.id && data.roomId === roomRef.current) {
            console.log("Updating whiteboard with new data");
            setWhiteboardData(data.drawingData);
          }
        });
        
        socketRef.current.on('random_match_found', (data: { matchedUser: User }) => {
          console.log("Random match found:", data.matchedUser);
          setMatchedUser(data.matchedUser);
          setIsWaitingForMatch(false);
        });
        
        socketRef.current.on('random_match_ended', () => {
          console.log("Random match ended");
          setMatchedUser(null);
          setIsWaitingForMatch(false);
        });
      } catch (err) {
        console.error("Error initializing socket:", err);
        setError(`Error initializing socket: ${err}`);
        setUseMockSocket(true);
      }
    }
    
    if (useMockSocket) {
      try {
        console.log("Initializing mock socket service");
        mockSocketRef.current = createMockSocketService(initialUser);
        setConnected(true);
        setError(null);
        
        firebaseServiceRef.current.loginUser(initialUser);
      } catch (err) {
        console.error("Error initializing mock socket:", err);
        setError(`Error initializing mock socket: ${err}`);
      }
    }

    return () => {
      console.log("Cleaning up socket connection on unmount");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (userRef.current && roomRef.current) {
        console.log(`Marking user ${userRef.current.id} as offline before cleanup`);
        firebaseServiceRef.current.markUserOffline(userRef.current.id, roomRef.current);
      }
      
      firebaseServiceRef.current.removeAllListeners();
      
      cleanupListeners.current.forEach(cleanup => cleanup());
      cleanupListeners.current = [];
    };
  }, [initialUser, socketServerUrl, useMockSocket]);

  const watchRoomMessages = useCallback((roomId: string) => {
    initialRoomLoadComplete.current = false;
    initialLoadTimestamp.current = Date.now();
    processedMessageIds.current.clear();
    processedPollIds.current.clear();
    
    const messagesRef = firebaseServiceRef.current.watchRoomMessages(roomId, (msgs) => {
      console.log(`Got ${msgs.length} messages for room ${roomId}`);
      
      const recentMessages = filterRecentMessages(msgs);
      
      if (!initialRoomLoadComplete.current) {
        console.log("Initial room messages loaded");
        
        recentMessages.forEach(msg => {
          processedMessageIds.current.add(msg.id);
          if (msg.content.startsWith('__POLL__:')) {
            try {
              const pollData = JSON.parse(msg.content.replace('__POLL__:', ''));
              if (pollData && pollData.id) {
                processedPollIds.current.add(pollData.id);
              }
            } catch (e) {
              console.error('Error parsing poll data:', e);
            }
          }
        });
        
        setMessages(recentMessages);
        initialRoomLoadComplete.current = true;
        return;
      }
      
      if (PREVENT_DUPLICATE_MESSAGES) {
        if (messageOperationInProgress.current) {
          console.log("Message operation in progress, skipping update");
          return;
        }
        
        const newMessages = recentMessages.filter(msg => {
          if (msg.content.startsWith('__POLL__:')) {
            try {
              const pollData = JSON.parse(msg.content.replace('__POLL__:', ''));
              if (pollData && pollData.id) {
                if (processedPollIds.current.has(pollData.id)) {
                  return false;
                }
                processedPollIds.current.add(pollData.id);
                setTimeout(() => {
                  processedPollIds.current.delete(pollData.id);
                }, POLL_DUPLICATE_WINDOW);
              }
            } catch (e) {
              console.error('Error parsing poll data:', e);
            }
          }
          
          return !processedMessageIds.current.has(msg.id) && 
                 msg.timestamp > initialLoadTimestamp.current;
        });
        
        if (newMessages.length > 0) {
          console.log(`Adding ${newMessages.length} new messages`);
          newMessages.forEach(msg => processedMessageIds.current.add(msg.id));
          
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg.id));
            const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
            return [...prev, ...uniqueNewMessages];
          });
        }
      } else {
        setMessages(recentMessages);
      }
    });
    
    return messagesRef;
  }, [isDuplicateMessage, filterRecentMessages]);

  const joinRoom = useCallback((roomName: string, user: User) => {
    console.log(`Joining room: ${roomName} with user:`, user);
    
    if (!useMockSocket && (!socketRef.current || !socketRef.current.connected)) {
      console.error("Cannot join room: Socket not connected");
      if (USE_MOCK_SOCKET_FALLBACK) {
        console.log("Falling back to mock socket service");
        setUseMockSocket(true);
        return;
      }
      return;
    }
    
    if (roomRef.current) {
      console.log(`Leaving current room: ${roomRef.current}`);
      leaveRoom(roomRef.current, user);
    }
    
    cleanupListeners.current.forEach(cleanup => cleanup());
    cleanupListeners.current = [];
    
    setMessages([]);
    setOnlineUsers([]);
    setWhiteboardData(undefined);
    processedMessageIds.current.clear();
    initialRoomLoadComplete.current = false;
    initialLoadTimestamp.current = Date.now();
    
    if (useMockSocket && mockSocketRef.current) {
      console.log("Joining room with mock socket service");
      
      const mockUsers = mockSocketRef.current.joinRoom(roomName, user);
      setOnlineUsers([...mockUsers]);
      
      const mockMessages = mockSocketRef.current.getMessages(roomName);
      const recentMockMessages = filterRecentMessages(mockMessages);
      setMessages([...recentMockMessages]);
      initialRoomLoadComplete.current = true;
    } else if (socketRef.current) {
      socketRef.current.emit('join_room', { roomName, user });
    }
    
    firebaseServiceRef.current.joinRoom(roomName, user);
    
    const unsubscribeUsers = firebaseServiceRef.current.watchRoomUsers(roomName, (users) => {
      console.log(`Got ${users.length} users for room ${roomName}`);
      
      const activeUsers = users.filter(u => {
        return !u.lastActive || (Date.now() - u.lastActive) < USER_ONLINE_TIMEOUT;
      });
      
      setOnlineUsers(activeUsers);
    });
    
    const unsubscribeMessages = watchRoomMessages(roomName);
    
    cleanupListeners.current.push(unsubscribeUsers);
    cleanupListeners.current.push(unsubscribeMessages);
    
    if (roomName === 'random') {
      setIsWaitingForMatch(true);
      
      const unsubscribeMatch = firebaseServiceRef.current.watchRandomMatch(user.id, (matched) => {
        if (matched) {
          console.log("Matched with user:", matched);
          setMatchedUser(matched);
          setIsWaitingForMatch(false);
        }
      });
      
      cleanupListeners.current.push(unsubscribeMatch);
      
      if (!useMockSocket && socketRef.current) {
        socketRef.current.emit('find_random_match', { user });
      } else if (useMockSocket && mockSocketRef.current) {
        const matchResult = mockSocketRef.current.findRandomMatch(user);
        if (matchResult) {
          setMatchedUser(matchResult);
          setIsWaitingForMatch(false);
        }
      }
    }
    
    setCurrentRoom(roomName);
    roomRef.current = roomName;
  }, [useMockSocket, isDuplicateMessage, filterRecentMessages, watchRoomMessages]);

  const leaveRoom = useCallback((roomName: string, user: User) => {
    console.log(`Leaving room: ${roomName}`);
    
    if (!useMockSocket && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_room', { roomName, user });
    } else if (useMockSocket && mockSocketRef.current) {
      mockSocketRef.current.leaveRoom(roomName, user);
    }
    
    firebaseServiceRef.current.markUserOffline(user.id, roomName);
    firebaseServiceRef.current.leaveRoom(roomName, user);
    
    cleanupListeners.current.forEach(cleanup => cleanup());
    cleanupListeners.current = [];
    
    setMessages([]);
    setOnlineUsers([]);
    setCurrentRoom(null);
    setMatchedUser(null);
    setIsWaitingForMatch(false);
    setWhiteboardData(undefined);
    processedMessageIds.current.clear();
    
    roomRef.current = null;
  }, [useMockSocket]);

  const sendMessage = useCallback((
    content: string, 
    sender: User, 
    room: string, 
    isVoiceMessage: boolean = false, 
    voiceUrl?: string
  ) => {
    console.log(`Sending message to room ${room}:`, content);
    
    if (!useMockSocket && (!socketRef.current || !socketRef.current.connected)) {
      console.error("Cannot send message: Socket not connected");
      return;
    }
    
    messageOperationInProgress.current = true;
    
    const newMessage: Message = {
      id: generateId(),
      content,
      sender,
      timestamp: Date.now(),
      room,
      reactions: [],
      isVoiceMessage,
      voiceUrl
    };
    
    console.log("Created message:", newMessage);
    
    processedMessageIds.current.add(newMessage.id);
    
    setTimeout(() => {
      processedMessageIds.current.delete(newMessage.id);
    }, DUPLICATE_MESSAGE_WINDOW);
    
    setMessages(prev => [...prev, newMessage]);
    
    if (!useMockSocket && socketRef.current) {
      socketRef.current.emit('message', newMessage);
    } else if (useMockSocket && mockSocketRef.current) {
      mockSocketRef.current.sendMessage(newMessage);
    }
    
    firebaseServiceRef.current.sendMessage(newMessage);
    
    setTimeout(() => {
      messageOperationInProgress.current = false;
    }, 300);
  }, [useMockSocket]);

  const addReaction = useCallback((messageId: string, reaction: string, user: User) => {
    console.log(`Adding reaction ${reaction} to message ${messageId}`);
    
    if (!useMockSocket && (!socketRef.current || !socketRef.current.connected)) {
      console.error("Cannot add reaction: Socket not connected");
      return;
    }
    
    if (!currentRoom) {
      console.error("Cannot add reaction: No current room");
      return;
    }

    if (!useMockSocket && socketRef.current) {
      socketRef.current.emit('reaction', { messageId, reaction, user, roomId: currentRoom });
    } else if (useMockSocket && mockSocketRef.current) {
      mockSocketRef.current.addReaction(messageId, reaction, user, currentRoom);
    }
    
    firebaseServiceRef.current.addReaction(messageId, reaction, user, currentRoom);
    
    setMessages(prevMessages => 
      prevMessages.map(message => {
        if (message.id === messageId) {
          const existingReactionIndex = message.reactions.findIndex(
            r => r.user.id === user.id && r.reaction === reaction
          );
          
          if (existingReactionIndex !== -1) {
            return {
              ...message,
              reactions: message.reactions.filter((_, index) => index !== existingReactionIndex)
            };
          } else {
            return {
              ...message,
              reactions: [...message.reactions, { user, reaction, timestamp: Date.now() }]
            };
          }
        }
        return message;
      })
    );
  }, [currentRoom, useMockSocket]);

  const sendWhiteboardData = useCallback((data: WhiteboardData) => {
    console.log("Sending whiteboard data to room:", data.roomId);
    
    if (!useMockSocket && (!socketRef.current || !socketRef.current.connected)) {
      console.error("Cannot send whiteboard data: Socket not connected");
      return;
    }
    
    if (!useMockSocket && socketRef.current) {
      socketRef.current.emit('whiteboard_update', data);
    } else if (useMockSocket && mockSocketRef.current) {
      mockSocketRef.current.updateWhiteboard(data);
    }
    
    const drawingRef = `rooms/${data.roomId}/whiteboard`;
    const db = firebaseServiceRef.current.getDatabase();
    if (db) {
      const ref = firebaseServiceRef.current.getDatabaseRef(drawingRef);
      firebaseServiceRef.current.setDatabaseValue(ref, {
        lastUpdated: Date.now(),
        userId: data.userId,
        drawingData: data.drawingData
      });
    }
  }, [useMockSocket]);

  const sendPoll = useCallback((pollData: Omit<PollData, 'id' | 'createdAt'>) => {
    console.log("Creating poll in room:", currentRoom);
    
    if (!useMockSocket && (!socketRef.current || !socketRef.current.connected) || !currentRoom) {
      console.error("Cannot create poll: Socket not connected or no current room");
      return;
    }
    
    if (pollOperationInProgress.current) {
      console.log("Poll operation already in progress, skipping");
      return;
    }
    
    pollOperationInProgress.current = true;
    
    const pollId = generateId();
    
    const completePollData: PollData = {
      ...pollData,
      id: pollId,
      createdAt: Date.now()
    };
    
    console.log("Created complete poll data:", completePollData);
    
    if (currentRoom) {
      firebaseServiceRef.current.sendPoll(completePollData, currentRoom);
    }
    
    processedPollIds.current.add(pollId);
    
    const pollMessage: Message = {
      id: generateId(),
      content: `__POLL__:${JSON.stringify(completePollData)}`,
      sender: userRef.current!,
      timestamp: Date.now(),
      room: currentRoom,
      reactions: []
    };
    
    processedMessageIds.current.add(pollMessage.id);
    
    console.log("Sending poll message:", pollMessage);
    
    if (!useMockSocket && socketRef.current) {
      socketRef.current.emit('message', pollMessage);
    } else if (useMockSocket && mockSocketRef.current) {
      mockSocketRef.current.sendMessage(pollMessage);
    }
    
    firebaseServiceRef.current.sendMessage(pollMessage);
    
    setMessages(prevMessages => [...prevMessages, pollMessage]);
    
    setTimeout(() => {
      pollOperationInProgress.current = false;
    }, POLL_DUPLICATE_WINDOW);
  }, [currentRoom, useMockSocket]);

  const votePoll = useCallback((pollId: string, optionId: string) => {
    console.log(`useSocket.votePoll: Poll ${pollId}, option ${optionId}`);
    
    if (!userRef.current) {
      console.error("Cannot vote on poll: No current user");
      return;
    }
    
    if (!currentRoom) {
      console.error("Cannot vote on poll: No current room");
      return;
    }
    
    console.log(`Voting: Poll: ${pollId}, Option: ${optionId}, User: ${userRef.current.id}, Room: ${currentRoom}`);
    
    firebaseServiceRef.current.votePoll(pollId, optionId, userRef.current.id, currentRoom);
    
    if (!useMockSocket && socketRef.current) {
      socketRef.current.emit('poll_vote', { 
        pollId, 
        optionId, 
        userId: userRef.current.id,
        roomId: currentRoom 
      });
    } else if (useMockSocket && mockSocketRef.current) {
      mockSocketRef.current.votePoll(pollId, optionId, userRef.current.id, currentRoom);
    }
  }, [currentRoom, useMockSocket]);

  return {
    messages,
    onlineUsers,
    currentRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    addReaction,
    connected,
    reconnecting,
    error,
    matchedUser,
    isWaitingForMatch,
    sendWhiteboardData,
    whiteboardData,
    sendPoll,
    votePoll
  };
};
