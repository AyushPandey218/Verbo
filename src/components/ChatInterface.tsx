import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { Room, User } from '@/utils/messageUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  ArrowLeft, 
  Users2, 
  ChevronLeft, 
  Copy, 
  Key, 
  Pencil, 
  PenLine, 
  FileEdit, 
  PenTool,
  MessageSquare,
  Smile
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineUsers from './OnlineUsers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ActionToolbar from './ActionToolbar';
import MessageBubble from './MessageBubble';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import UserProfile from './UserProfile';
import ConnectionStatus from './ConnectionStatus';
import GroupManager from './GroupManager';
import { useToast } from '@/components/ui/use-toast';
import { isPrivateRoom, extractPrivateRoomCode } from '@/utils/config';
import MessageInput from './MessageInput';
import Whiteboard from './Whiteboard';

interface ChatInterfaceProps {
  user: User;
  messages: any[];
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
  whiteboardData: string | undefined;
  connected?: boolean;
  privateRoomCode?: string | null;
  onSaveDrawing?: (imageUrl: string) => void;
  onBackToGreeting?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  user,
  messages,
  onlineUsers,
  roomName,
  onSendMessage,
  onSendVoiceMessage,
  onLeaveRoom,
  onSignOut,
  onAddReaction,
  onCreateGroup,
  onJoinGroup,
  onJoinGroupClick,
  onAddFriend,
  onSendWhiteboardData,
  onSendPoll,
  onVotePoll,
  groups,
  friends,
  matchedUser,
  isRandomChat,
  whiteboardData,
  connected = false,
  privateRoomCode = null,
  onSaveDrawing,
  onBackToGreeting,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOnlineUsersPopoverOpen, setIsOnlineUsersPopoverOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
    setSelectedUser(null);
  };

  const sortedOnlineUsers = useMemo(() => {
    return [...onlineUsers].sort((a, b) => a.name.localeCompare(b.name));
  }, [onlineUsers]);

  const handleGoBack = () => {
    if (onBackToGreeting) {
      onBackToGreeting();
    } else {
      onLeaveRoom();
    }
  };

  const handleScrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    handleScrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  }, [messages]);

  const handleCopyRoomCode = () => {
    if (privateRoomCode) {
      navigator.clipboard.writeText(privateRoomCode);
      toast({
        description: "Room code copied to clipboard",
        duration: 3000,
      });
    }
  };

  const handleOpenWhiteboard = () => {
    setIsWhiteboardOpen(true);
  };

  const handleCloseWhiteboard = () => {
    setIsWhiteboardOpen(false);
  };

  const handleSendWhiteboardData = (data: any) => {
    if (onSendWhiteboardData) {
      onSendWhiteboardData(data);
    }
  };

  const handleSaveWhiteboard = (imageUrl: string) => {
    console.log("Saving whiteboard image:", imageUrl.substring(0, 50) + "...");
    if (onSaveDrawing) {
      onSaveDrawing(imageUrl);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      <Card className="flex-1 flex flex-col overflow-hidden rounded-none shadow-none border-none h-full">
        <CardHeader className="flex flex-shrink-0 items-center py-3 px-4 border-b backdrop-blur-md z-20 shadow-sm bg-white/95 dark:bg-gray-900/95">
          <div className="flex w-full items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleGoBack} className="md:hidden">
              <ArrowLeft size={18} />
            </Button>
            
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-violet-100">
                <AvatarImage 
                  src={matchedUser ? matchedUser.photoURL : ''} 
                  alt={matchedUser ? matchedUser.name : roomName} 
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                  {(matchedUser ? matchedUser.name : roomName).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col items-start">
                <div className="font-semibold text-lg leading-tight flex items-center gap-2">
                  {matchedUser ? matchedUser.name : roomName}
                  {connected && (
                    <Badge className="ml-2 bg-green-50 text-green-600 border-green-200 font-normal text-xs">
                      Online
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="flex items-center">
                    {isRandomChat ? 'Random Chat' : roomName}
                    {onlineUsers.length > 0 && (
                      <Badge className="ml-2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors">
                        {onlineUsers.length} online
                      </Badge>
                    )}
                  </div>
                  
                  {isPrivateRoom(roomName) && privateRoomCode && (
                    <div className="flex items-center bg-indigo-100 px-2 py-0.5 rounded-full text-xs">
                      <Key size={10} className="text-indigo-600 mr-1" />
                      <span className="text-indigo-700 font-medium mr-2">{privateRoomCode}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 p-0 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-200"
                        onClick={handleCopyRoomCode}
                      >
                        <Copy size={10} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {onBackToGreeting && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onBackToGreeting}
                  className="h-8 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hidden md:flex"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="text-xs">Back</span>
                </Button>
              )}
              <Popover open={isOnlineUsersPopoverOpen} onOpenChange={setIsOnlineUsersPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 relative gap-1 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                  >
                    <Users2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Users</span>
                    <Badge className="absolute -top-1 -right-1 bg-indigo-500 text-white h-4 w-4 flex items-center justify-center p-0">
                      {onlineUsers.length}
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 h-[400px] border-indigo-100 shadow-lg shadow-indigo-100/20" align="end">
                  <OnlineUsers 
                    users={sortedOnlineUsers} 
                    connected={connected}
                    onSelectUser={openProfile}
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar relative scroll-smooth"
        >
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="text-xs text-muted-foreground text-center mb-4 sticky top-0 bg-white/80 backdrop-blur-sm py-1 rounded-full shadow-sm mx-auto w-fit px-3 border border-indigo-100/50">
                {date}
              </div>
              
              <div className="space-y-6">
                {dateMessages.map((message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message} 
                    user={user} 
                    onAddReaction={onAddReaction}
                    onVotePoll={onVotePoll}
                  />
                ))}
              </div>
            </div>
          ))}
          
          <div ref={chatBottomRef} />
          
          {showScrollButton && (
            <button
              onClick={handleScrollToBottom}
              className="absolute bottom-4 right-4 bg-indigo-600 text-white rounded-full p-2 shadow-lg hover:bg-indigo-700 transition-all animate-bounce-slow z-10"
            >
              <MessageSquare size={16} />
            </button>
          )}
        </CardContent>

        <CardFooter className="p-0 border-t backdrop-blur-md sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] bg-white/95 dark:bg-gray-900/95">
          <div className="w-full">
            <MessageInput 
              onSend={onSendMessage} 
              onSendVoice={onSendVoiceMessage || (() => {})} 
              onSendWhiteboardData={onSendWhiteboardData}
              onSendPoll={onSendPoll}
              currentUser={user}
              roomId={roomName}
              onOpenWhiteboard={handleOpenWhiteboard}
            />
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <UserProfile 
            user={selectedUser || user} 
            onSignOut={closeProfile} 
            onAddFriend={onAddFriend}
            friends={friends}
            onBackToGreeting={onBackToGreeting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={() => setIsGroupDialogOpen(!isGroupDialogOpen)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a Group</DialogTitle>
          </DialogHeader>
          <GroupManager 
            user={user}
            onCreateGroup={onCreateGroup} 
            onJoinGroup={onJoinGroup} 
            onJoinGroupClick={onJoinGroupClick} 
            groups={groups} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isWhiteboardOpen} onOpenChange={setIsWhiteboardOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool size={16} className="text-indigo-600" />
              Whiteboard
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(90vh-6rem)] overflow-hidden">
            <Whiteboard 
              roomId={roomName}
              userId={user.id}
              onClose={handleCloseWhiteboard}
              onSaveDrawing={handleSaveWhiteboard}
              onDrawingUpdate={handleSendWhiteboardData}
              drawingData={whiteboardData || undefined}
              onlineUsers={onlineUsers}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
