
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/context/ChatContext';
import ChatInterface from '@/components/ChatInterface';
import JoinRoom from '@/components/JoinRoom';
import GuestSignIn from '@/components/GuestSignIn';
import { LOGOUT_STORAGE_CLEANUP_ITEMS } from '@/utils/config';
import { User } from '@/utils/messageUtils';

const Index = () => {
  const { user: authUser, signIn, signOut } = useAuth();
  const [showGuestSignIn, setShowGuestSignIn] = useState(false);
  
  const { 
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
    sendWhiteboardData,
    sendPoll,
    votePoll,
    signOut: chatSignOut
  } = useChat();
  
  // Handle auth signout
  const handleSignOut = () => {
    // Clean up localStorage
    LOGOUT_STORAGE_CLEANUP_ITEMS.forEach(item => {
      localStorage.removeItem(item);
    });
    
    // Sign out from chat and auth
    chatSignOut();
    signOut();
    
    // Reset guest sign in state
    setShowGuestSignIn(false);
  };
  
  // Handle guest sign in
  const handleGuestSignIn = (guestUser: User) => {
    setCurrentUser(guestUser);
    setShowGuestSignIn(false);
  };
  
  // Handle back to login
  const handleBackToLogin = () => {
    handleSignOut();
  };
  
  // Handle joining group
  const handleJoinGroupClick = (groupId: string) => {
    joinRoom(groupId);
  };
  
  // Render login screen if no user is set
  if (!currentUser) {
    if (showGuestSignIn) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <GuestSignIn onGuestSignIn={handleGuestSignIn} />
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-md space-y-8 p-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">Verbo</h1>
            <p className="text-muted-foreground">Real-time messaging, simplified</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowGuestSignIn(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium rounded-lg shadow transition-colors"
            >
              Continue as Guest
            </button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>No login required to start chatting!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If user is logged in but not in a room, show join room screen
  if (!currentRoom) {
    return (
      <JoinRoom
        user={currentUser}
        onJoin={joinRoom}
        onSignOut={handleSignOut}
        connected={connected}
        reconnecting={reconnecting}
        error={connectionError}
        privateRoomCode={privateRoomCode}
        onBackToLogin={handleBackToLogin}
      />
    );
  }
  
  // If user is logged in and in a room, show chat interface
  return (
    <ChatInterface
      user={currentUser}
      messages={messages}
      onlineUsers={onlineUsers}
      roomName={currentRoom}
      onSendMessage={sendMessage}
      onSendVoiceMessage={sendVoiceMessage}
      onLeaveRoom={leaveRoom}
      onSignOut={handleSignOut}
      onAddReaction={addReaction}
      onCreateGroup={createGroup}
      onJoinGroup={joinGroup}
      onJoinGroupClick={handleJoinGroupClick}
      onAddFriend={() => {}}
      onSendWhiteboardData={sendWhiteboardData}
      onSendPoll={sendPoll}
      onVotePoll={votePoll}
      groups={groups}
      friends={friends}
      matchedUser={matchedUser}
      isRandomChat={isRandomChat}
      whiteboardData={whiteboardData}
      connected={connected}
      privateRoomCode={privateRoomCode}
      onBackToGreeting={() => leaveRoom()}
    />
  );
};

export default Index;
