
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/context/ChatContext';
import ChatInterface from '@/components/ChatInterface';
import JoinRoom from '@/components/JoinRoom';
import GuestSignIn from '@/components/GuestSignIn';
import { LOGOUT_STORAGE_CLEANUP_ITEMS } from '@/utils/config';
import { User } from '@/utils/messageUtils';
import { MessageSquare, Users, Zap } from 'lucide-react';

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
  
  const handleSignOut = () => {
    LOGOUT_STORAGE_CLEANUP_ITEMS.forEach(item => {
      localStorage.removeItem(item);
    });
    
    chatSignOut();
    signOut();
    
    setShowGuestSignIn(false);
  };
  
  const handleGuestSignIn = (guestUser: User) => {
    setCurrentUser(guestUser);
    setShowGuestSignIn(false);
  };
  
  const handleBackToLogin = () => {
    handleSignOut();
  };
  
  const handleJoinGroupClick = (groupId: string) => {
    joinRoom(groupId);
  };

  useEffect(() => {
    if (authUser && !currentUser) {
      setCurrentUser(authUser);
    }
  }, [authUser, currentUser, setCurrentUser]);
  
  if (!currentUser) {
    if (showGuestSignIn) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <GuestSignIn onGuestSignIn={handleGuestSignIn} />
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-md space-y-8 p-6">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text animate-slide-in">
              Verbo
            </h1>
            <p className="text-lg text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              Real-time messaging, simplified
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-8">
              <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-lg animate-bubble-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <MessageSquare className="w-8 h-8 mx-auto mb-3 text-violet-500 animate-bounce-slow" />
                <h3 className="font-medium text-gray-900">Real-time Chat</h3>
                <p className="text-sm text-gray-500">Connect instantly with others</p>
              </div>
              
              <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-lg animate-bubble-in opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                <Users className="w-8 h-8 mx-auto mb-3 text-indigo-500 animate-bounce-slow" />
                <h3 className="font-medium text-gray-900">Group Chats</h3>
                <p className="text-sm text-gray-500">Create & join group conversations</p>
              </div>
              
              <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-lg animate-bubble-in opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                <Zap className="w-8 h-8 mx-auto mb-3 text-purple-500 animate-bounce-slow" />
                <h3 className="font-medium text-gray-900">Fast & Secure</h3>
                <p className="text-sm text-gray-500">End-to-end encrypted chats</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 animate-fade-in opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
            <button 
              onClick={() => signIn()}
              className="w-full h-12 px-4 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow transition-all flex items-center justify-center gap-3 border border-gray-300 hover:scale-105 duration-300"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowGuestSignIn(true)}
              className="w-full h-12 py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium rounded-lg shadow transition-all hover:scale-105 duration-300"
            >
              Continue as Guest
            </button>
            
            <div className="text-center text-sm text-muted-foreground animate-fade-in opacity-0" style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}>
              <p>No login required to start chatting!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
