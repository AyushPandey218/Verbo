
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import ChatInterface from '@/components/ChatInterface';
import JoinRoom from '@/components/JoinRoom';
import GuestSignIn from '@/components/GuestSignIn';
import { User, createGuestUser, generateGroupCode, generateId } from '@/utils/messageUtils';
import { useToast } from '@/components/ui/use-toast';
import { PollData } from '@/components/Poll';
import { DEBUG_CONNECTION_STATUS, ROOM_PREFIXES, extractPrivateRoomCode, isPrivateRoom } from '@/utils/config';

const Index = () => {
  const { user, loading, error: authError, signIn, signOut } = useAuth();
  const [guestUser, setGuestUser] = useState<User | null>(null);
  const currentUser = user || guestUser;
  const { toast } = useToast();
  
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  
  const { 
    messages, 
    onlineUsers, 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    currentRoom: socketRoom,
    addReaction,
    sendWhiteboardData,
    whiteboardData,
    sendPoll,
    votePoll,
    isWaitingForMatch,
    matchedUser,
    connected,
    reconnecting,
    error: socketError
  } = useSocket({ user: currentUser || undefined as any });

  useEffect(() => {
    if (socketRoom) {
      setCurrentRoom(socketRoom);
    }
  }, [socketRoom]);

  useEffect(() => {
    if (DEBUG_CONNECTION_STATUS) {
      console.log(`Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
      console.log(`Reconnecting: ${reconnecting ? 'Yes' : 'No'}`);
      console.log(`Error: ${socketError || 'None'}`);
      console.log(`Online users: ${onlineUsers.length}`);
    }
  }, [connected, reconnecting, socketError, onlineUsers.length]);

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('chatUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id && parsedUser.id.startsWith('guest-')) {
            console.log("Found stored guest user:", parsedUser);
            const updatedGuestUser = {
              ...parsedUser,
              online: true
            };
            setGuestUser(updatedGuestUser);
          }
        } catch (e) {
          console.error("Error parsing stored guest user:", e);
          localStorage.removeItem('chatUser');
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (currentUser) {
      setCurrentRoom(null);
      if (localStorage.getItem('lastRoom')) {
        localStorage.removeItem('lastRoom');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (socketError) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: socketError,
        duration: 5000,
      });
    }
  }, [socketError, toast]);

  const handleJoinRoom = (roomName: string) => {
    if (currentUser) {
      console.log("Index: Joining room:", roomName, "Current user:", currentUser);
      
      if (connected) {
        joinRoom(roomName, currentUser);
        setCurrentRoom(roomName);
        
        if (roomName === 'random') {
          toast({
            description: "Looking for someone to chat with...",
            duration: 3000,
          });
        } else if (roomName === 'general') {
          toast({
            description: "Welcome to the general chat room!",
            duration: 3000,
          });
        } else if (roomName.startsWith(ROOM_PREFIXES.PRIVATE)) {
          const roomCode = extractPrivateRoomCode(roomName);
          toast({
            description: `Joined private room with code: ${roomCode}`,
            duration: 3000,
          });
        } else {
          toast({
            description: `Joined ${roomName}`,
            duration: 3000,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Unable to connect to chat. Please try again.",
          duration: 5000,
        });
        console.error("Attempted to join room but socket is not connected");
      }
    } else {
      console.error("Cannot join room: No current user");
    }
  };

  const handleLeaveRoom = () => {
    if (currentUser && currentRoom) {
      leaveRoom(currentRoom, currentUser);
      setCurrentRoom(null);
      
      if (currentRoom === 'random' && matchedUser) {
        toast({
          description: "You have disconnected from the chat",
          duration: 3000,
        });
      }
    }
  };

  const handleBackToGreeting = () => {
    if (currentUser && currentRoom) {
      leaveRoom(currentRoom, currentUser);
      setCurrentRoom(null);
      
      toast({
        description: "Returned to room selection",
        duration: 3000,
      });
    }
  };

  const handleSendMessage = (content: string) => {
    if (currentUser && currentRoom) {
      console.log("Index: Sending message:", content, "User:", currentUser, "Room:", currentRoom);
      
      const tempMessage = {
        id: generateId(),
        content,
        sender: currentUser,
        timestamp: Date.now(),
        room: currentRoom,
        reactions: [],
        isLocal: true
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      sendMessage(content, currentUser, currentRoom);
    } else {
      console.error("Cannot send message - missing user or room:", { user: currentUser, room: currentRoom });
    }
  };

  const handleSendVoiceMessage = (blob: Blob, audioUrl: string) => {
    if (currentUser && currentRoom) {
      try {
        console.log("Sending voice message with URL:", audioUrl);
        
        // Create a new FileReader to read the blob as base64
        const reader = new FileReader();
        reader.onloadend = () => {
          // The result is a base64 string representation of the file
          const base64data = reader.result?.toString().split(',')[1]; // Remove the data URL prefix
          
          // Send the voice message
          sendMessage("Voice message", currentUser, currentRoom, {
            isVoiceMessage: true,
            audioUrl: audioUrl,
            audioData: base64data
          });
          
          toast({
            description: "Voice message sent",
            duration: 3000,
          });
        };
        
        // Read the blob as a data URL (base64)
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error creating voice message:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not send voice message. Please try again.",
        });
      }
    } else {
      console.error("Cannot send voice message - missing user or room");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot send voice message. Please try again.",
      });
    }
  };

  const handleSignOut = () => {
    if (guestUser) {
      setGuestUser(null);
      localStorage.removeItem('chatUser');
      handleLeaveRoom();
      setCurrentRoom(null);
    } else {
      signOut();
    }
  };

  const handleGuestSignIn = (guest: User) => {
    console.log("Guest signed in:", guest);
    const updatedGuest = {
      ...guest,
      online: true
    };
    setGuestUser(updatedGuest);
    toast({
      description: `Welcome, ${guest.name}!`,
      duration: 3000,
    });
  };

  const handleAddReaction = (messageId: string, reaction: string) => {
    if (currentUser) {
      console.log("Adding reaction:", reaction, "to message:", messageId, "by user:", currentUser.id);
      addReaction(messageId, reaction, currentUser);
    }
  };

  const handleCreateGroup = (name: string) => {
    const newGroup = {
      id: 'group-' + Date.now(),
      name,
      users: [currentUser],
      isGroup: true,
      groupCode: generateGroupCode(),
      createdBy: currentUser?.id
    };
    
    setGroups(prev => [...prev, newGroup]);
    toast({
      title: "Group created",
      description: `'${name}' has been created. Group code: ${newGroup.groupCode}`,
      duration: 5000,
    });
  };

  const handleJoinGroup = (code: string) => {
    toast({
      description: `Attempting to join group with code: ${code}`,
      duration: 3000,
    });
    
    const foundGroup = groups.find(group => group.groupCode === code);
    
    if (foundGroup) {
      const updatedGroup = {
        ...foundGroup,
        users: [...foundGroup.users, currentUser]
      };
      
      setGroups(prev => prev.map(g => g.id === foundGroup.id ? updatedGroup : g));
      
      handleJoinRoom(foundGroup.id);
      
      toast({
        title: "Group joined",
        description: `You've joined '${foundGroup.name}'`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Group not found",
        description: "Please check the code and try again",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleJoinGroupClick = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    
    if (group) {
      handleJoinRoom(groupId);
      
      toast({
        description: `Joined ${group.name}`,
        duration: 3000,
      });
    }
  };

  const handleAddFriend = (email: string) => {
    toast({
      title: "Friend request sent",
      description: `Request sent to ${email}`,
      duration: 3000,
    });
  };

  const handleSendWhiteboardData = (data: any) => {
    console.log("Sending whiteboard data:", data);
    sendWhiteboardData(data);
  };

  const handleSendPoll = (pollData: Omit<PollData, 'id' | 'createdAt'>) => {
    console.log("Creating poll:", pollData);
    sendPoll(pollData);
    
    toast({
      title: "Poll created",
      description: `Poll "${pollData.question}" created successfully`,
      duration: 3000,
    });
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    console.log("Voting on poll:", pollId, "option:", optionId);
    votePoll(pollId, optionId);
    
    toast({
      description: "Your vote has been recorded",
      duration: 3000,
    });
  };

  useEffect(() => {
    console.log("Current room state:", currentRoom);
    console.log("Online users:", onlineUsers);
    console.log("Current user:", currentUser);
    console.log("Current messages:", messages);
  }, [currentRoom, onlineUsers, currentUser, messages]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="flex space-x-2 justify-center items-center">
          <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse"></div>
          <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse animation-delay-200"></div>
          <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse animation-delay-400"></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <p className="text-destructive mb-4">Error: {authError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  console.log("About to render based on currentRoom:", currentRoom);
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 animate-fade-in">
        <div className="text-center max-w-md mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">Verbo</h1>
          <p className="text-muted-foreground mb-6">A beautiful, real-time messaging experience</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <div className="glass p-8 rounded-2xl shadow-xl bg-white/80 backdrop-blur border border-white/20">
            <h2 className="text-xl font-semibold mb-4 text-center">Sign In</h2>
            <Button 
              onClick={signIn}
              className="w-full text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md"
            >
              Sign in with Google
            </Button>
            
            <p className="mt-4 text-xs text-center text-muted-foreground">
              Secure, simple, elegant
            </p>
          </div>
          
          <div className="glass rounded-2xl shadow-xl bg-white/80 backdrop-blur border border-white/20">
            <GuestSignIn onGuestSignIn={handleGuestSignIn} />
          </div>
        </div>
      </div>
    );
  }

  if (currentRoom === 'random' && isWaitingForMatch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 animate-fade-in">
        <div className="text-center max-w-md mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">Random Chat</h1>
          <p className="text-muted-foreground mb-6">Looking for someone to chat with...</p>
          <div className="flex space-x-2 justify-center items-center mb-6">
            <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse"></div>
            <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse animation-delay-200"></div>
            <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse animation-delay-400"></div>
          </div>
          <Button 
            onClick={handleLeaveRoom}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <JoinRoom 
        user={currentUser} 
        onJoin={handleJoinRoom} 
        onSignOut={handleSignOut}
        connected={connected}
        reconnecting={reconnecting}
        error={socketError}
        onBackToLogin={undefined}
      />
    );
  }

  const privateRoomCode = isPrivateRoom(currentRoom) ? extractPrivateRoomCode(currentRoom) : null;

  return (
    <ChatInterface
      user={currentUser}
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
      onBackToGreeting={handleBackToGreeting}
      groups={groups}
      friends={friends}
      matchedUser={matchedUser}
      isRandomChat={currentRoom === 'random' && matchedUser !== null}
      whiteboardData={whiteboardData}
      connected={connected}
      privateRoomCode={privateRoomCode}
    />
  );
};

export default Index;
