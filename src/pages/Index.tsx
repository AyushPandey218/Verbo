import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Button } from '@/components/ui/button';
import SocketService from '@/utils/socketService';
import JoinRoom from '@/components/JoinRoom';
import ChatInterface from '@/components/ChatInterface';
import GuestSignIn from '@/components/GuestSignIn';
import { useToast } from '@/components/ui/use-toast';
import { 
  generateId, 
  Message, 
  User, 
  Room, 
  extractPrivateRoomCode,
  isPrivateRoom
} from '@/utils/messageUtils';
import { LOGOUT_STORAGE_CLEANUP_ITEMS } from '@/utils/config';

export default function Index() {
  const { user, signOut } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [isRandomChat, setIsRandomChat] = useState(false);
  const [groups, setGroups] = useState<Room[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [whiteboardData, setWhiteboardData] = useState<string | undefined>(undefined);
  const socketRef = useRef<SocketService | null>(null);
  const { toast } = useToast();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      console.log("User authenticated, connecting to socket service");
      socketRef.current = SocketService.getInstance();
      socketRef.current.connect();
      socketRef.current.updateCurrentUser(user);
      socketRef.current.loginUser(user);

      // Set up socket event listeners
      setupSocketListeners();
      
      // Track connection status
      const checkConnection = () => {
        if (socketRef.current) {
          const isConnected = socketRef.current.isConnected();
          setConnected(isConnected);
        }
      };
      
      // Check connection immediately and then periodically
      checkConnection();
      const intervalId = setInterval(checkConnection, 5000);
      
      return () => {
        clearInterval(intervalId);
        if (socketRef.current) {
          // Leave room if in one
          if (currentRoom) {
            socketRef.current.leaveRoom(currentRoom);
          }
          
          // Remove all listeners and disconnect
          socketRef.current.off('message');
          socketRef.current.off('userList');
          socketRef.current.off('room_users');
          socketRef.current.off('room_history');
          socketRef.current.off('random_match_found');
          socketRef.current.off('random_match_ended');
          socketRef.current.off('new_whiteboard_data');
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  const setupSocketListeners = () => {
    if (!socketRef.current) return;
    
    // Listen for chat messages
    socketRef.current.on('message', (message) => {
      console.log("Received message:", message);
      if (message.room === currentRoom) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    // Listen for user list updates
    socketRef.current.on('userList', (users) => {
      console.log("User list updated:", users);
      setOnlineUsers(users);
    });
    
    // Listen for room user updates
    socketRef.current.on('room_users', (users) => {
      console.log("Room users updated:", users);
      setOnlineUsers(users);
    });
    
    // Listen for room history
    socketRef.current.on('room_history', (history) => {
      console.log("Room history received:", history?.length || 0);
      setMessages(history || []);
    });
    
    // Listen for random match found
    socketRef.current.on('random_match_found', (data) => {
      console.log("Random match found:", data);
      if (data.matchedUser) {
        setMatchedUser(data.matchedUser);
        toast({
          title: 'Match Found!',
          description: `You've been matched with ${data.matchedUser.name}`,
          duration: 5000,
        });
      }
    });
    
    // Listen for random match ended
    socketRef.current.on('random_match_ended', () => {
      console.log("Random match ended");
      setMatchedUser(null);
      setCurrentRoom(null);
      setIsRandomChat(false);
      setMessages([]);
      
      toast({
        title: 'Chat Ended',
        description: 'Your random chat has ended',
        duration: 5000,
      });
    });
    
    // Listen for whiteboard data
    socketRef.current.on('new_whiteboard_data', (data) => {
      console.log("Received whiteboard data:", data?.substring(0, 20) + "...");
      setWhiteboardData(data);
    });
  };

  const handleJoinRoom = (roomName: string) => {
    console.log("Joining room:", roomName);
    
    if (roomName === 'random') {
      console.log("Starting random chat match");
      setIsRandomChat(true);
      setCurrentRoom(roomName);
      
      if (socketRef.current && user) {
        socketRef.current.findRandomMatch(user);
      }
      return;
    }
    
    // Handle private rooms
    if (isPrivateRoom(roomName)) {
      const code = extractPrivateRoomCode(roomName);
      setPrivateRoomCode(code);
    } else {
      setPrivateRoomCode(null);
    }
    
    if (currentRoom) {
      // Leave current room first
      socketRef.current?.leaveRoom(currentRoom);
    }
    
    setCurrentRoom(roomName);
    setMatchedUser(null);
    setIsRandomChat(false);
    
    if (socketRef.current && user) {
      socketRef.current.joinRoom(roomName, user);
    }
  };

  const handleLeaveRoom = () => {
    if (currentRoom && socketRef.current) {
      socketRef.current.leaveRoom(currentRoom);
      
      if (isRandomChat) {
        socketRef.current.endRandomChat();
      }
    }
    
    setCurrentRoom(null);
    setMatchedUser(null);
    setIsRandomChat(false);
    setPrivateRoomCode(null);
    setMessages([]);
  };

  const handleSendMessage = (content: string) => {
    if (!currentRoom || !socketRef.current || !user) return;
    
    const newMessage: Message = {
      id: generateId(),
      content,
      sender: user,
      room: currentRoom,
      timestamp: Date.now(),
      reactions: []
    };
    
    socketRef.current.sendMessage(newMessage);
  };

  const handleSendVoiceMessage = (blob: Blob, audioUrl: string) => {
    if (!currentRoom || !socketRef.current || !user) return;
    
    const newMessage: Message = {
      id: generateId(),
      content: "Voice message",
      sender: user,
      room: currentRoom,
      timestamp: Date.now(),
      reactions: [],
      isVoiceMessage: true,
      voiceUrl: audioUrl
    };
    
    socketRef.current.sendMessage(newMessage);
  };

  const handleAddReaction = (messageId: string, reaction: string) => {
    if (!socketRef.current || !user) return;
    
    const reactionData = {
      messageId,
      reaction,
      user,
      room: currentRoom,
      timestamp: Date.now()
    };
    
    socketRef.current.sendMessage({
      type: 'reaction',
      ...reactionData
    });
    
    // Optimistically update UI
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          // Check if user already reacted with this emoji
          const existingReactionIndex = msg.reactions?.findIndex(
            r => r.user?.id === user.id && r.reaction === reaction
          );
          
          let newReactions = [...(msg.reactions || [])];
          
          if (existingReactionIndex !== undefined && existingReactionIndex >= 0) {
            // Remove the existing reaction (toggle behavior)
            newReactions = [
              ...newReactions.slice(0, existingReactionIndex),
              ...newReactions.slice(existingReactionIndex + 1)
            ];
          } else {
            // Add new reaction
            newReactions.push({
              reaction,
              user,
              timestamp: Date.now()
            });
          }
          
          return {
            ...msg,
            reactions: newReactions
          };
        }
        return msg;
      })
    );
  };

  const handleCreateGroup = (name: string) => {
    // TODO: Implement group creation functionality
    toast({
      title: "Group Created",
      description: `Created group: ${name}`,
      duration: 3000
    });
  };

  const handleJoinGroup = (code: string) => {
    // TODO: Implement join group functionality
    toast({
      title: "Joining Group",
      description: `Attempting to join group with code: ${code}`,
      duration: 3000
    });
  };

  const handleJoinGroupClick = (groupId: string) => {
    // TODO: Implement join group click functionality
    toast({
      title: "Joining Group",
      description: `Joining group: ${groupId}`,
      duration: 3000
    });
  };

  const handleAddFriend = (email: string) => {
    // TODO: Implement add friend functionality
    toast({
      title: "Friend Request Sent",
      description: `Friend request sent to: ${email}`,
      duration: 3000
    });
  };

  const handleSignOut = () => {
    handleLeaveRoom();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Clear stored data
    LOGOUT_STORAGE_CLEANUP_ITEMS.forEach(item => {
      localStorage.removeItem(item);
    });
    
    signOut();
    
    toast({
      description: "Signed out successfully",
      duration: 3000,
    });
  };

  const handleSendWhiteboardData = (data: any) => {
    if (!currentRoom || !socketRef.current) return;
    
    socketRef.current.sendMessage({
      type: 'whiteboard',
      room: currentRoom,
      data
    });
  };

  const handleSendPoll = (pollData: any) => {
    if (!currentRoom || !socketRef.current || !user) return;
    
    const pollId = generateId();
    const fullPollData = {
      ...pollData,
      id: pollId,
      createdAt: Date.now(),
      votes: []
    };
    
    const newMessage: Message = {
      id: generateId(),
      content: `__POLL__:${JSON.stringify(fullPollData)}`,
      sender: user,
      room: currentRoom,
      timestamp: Date.now(),
      reactions: []
    };
    
    socketRef.current.sendMessage(newMessage);
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    if (!currentRoom || !socketRef.current || !user) return;
    
    socketRef.current.sendMessage({
      type: 'poll_vote',
      pollId,
      optionId,
      user,
      room: currentRoom,
      timestamp: Date.now()
    });
    
    // Optimistically update UI
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.content?.startsWith('__POLL__:')) {
          try {
            const pollData = JSON.parse(msg.content.replace('__POLL__:', ''));
            if (pollData.id === pollId) {
              // Update poll with new vote
              const updatedPollData = {
                ...pollData,
                options: pollData.options.map((option: any) => {
                  if (option.id === optionId) {
                    return {
                      ...option,
                      votes: [...(option.votes || []), user.id]
                    };
                  }
                  return option;
                })
              };
              
              return {
                ...msg,
                content: `__POLL__:${JSON.stringify(updatedPollData)}`
              };
            }
          } catch (e) {
            console.error('Error updating poll vote in UI:', e);
          }
        }
        return msg;
      })
    );
  };

  const handleSaveDrawing = (imageUrl: string) => {
    if (!currentRoom || !socketRef.current || !user) return;
    
    const newMessage: Message = {
      id: generateId(),
      content: `Drawing shared`,
      sender: user,
      room: currentRoom,
      timestamp: Date.now(),
      reactions: [],
      isDrawing: true,
      drawingUrl: imageUrl
    };
    
    socketRef.current.sendMessage(newMessage);
  };

  console.log("About to render based on currentRoom:", currentRoom);
  console.log("Current room state:", currentRoom);
  console.log("Online users:", onlineUsers);
  console.log("Current user:", user);
  console.log("Current messages:", messages);

  // If not authenticated, show sign-in options
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <GuestSignIn onGuestSignIn={(newUser) => {
          if (useAuth().setUser) {
            useAuth().setUser(newUser);
          }
        }} />
      </div>
    );
  }

  // If authenticated but not in a room, show room selection
  if (!currentRoom) {
    return (
      <JoinRoom 
        user={user}
        onJoin={handleJoinRoom}
        onSignOut={handleSignOut}
        connected={connected}
        reconnecting={reconnecting}
        error={connError}
      />
    );
  }

  // If in a room, show chat interface
  return (
    <ChatInterface
      user={user}
      messages={messages}
      onlineUsers={onlineUsers}
      roomName={currentRoom}
      onSendMessage={handleSendMessage}
      onSendVoiceMessage={handleSendVoiceMessage}
      onLeaveRoom={handleLeaveRoom}
      onSignOut={handleSignOut}
      onAddReaction={handleAddReaction}
      onCreateGroup={handleCreateGroup}
      onJoinGroup={handleJoinGroup}
      onJoinGroupClick={handleJoinGroupClick}
      onAddFriend={handleAddFriend}
      onSendWhiteboardData={handleSendWhiteboardData}
      onSendPoll={handleSendPoll}
      onVotePoll={handleVotePoll}
      groups={groups}
      friends={friends}
      matchedUser={matchedUser}
      isRandomChat={isRandomChat}
      whiteboardData={whiteboardData}
      connected={connected}
      privateRoomCode={privateRoomCode}
      onSaveDrawing={handleSaveDrawing}
    />
  );
}
