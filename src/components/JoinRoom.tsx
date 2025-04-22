import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, getGreeting, generateId } from '@/utils/messageUtils';
import { MessageCircle, Users, LogOut, AlertTriangle, Key, Share2, Copy, ArrowLeft, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ConnectionStatus from './ConnectionStatus';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

interface JoinRoomProps {
  user: User;
  onJoin: (roomName: string) => void;
  onSignOut: () => void;
  connected?: boolean;
  reconnecting?: boolean;
  error?: string | null;
  privateRoomCode?: string | null;
  onBackToLogin?: () => void;
}

const PRESET_ROOMS = [
  { 
    id: 'general', 
    name: 'General Chat', 
    desc: 'Public chat room for everyone', 
    icon: Users 
  },
  { 
    id: 'random', 
    name: 'Random Match', 
    desc: 'One-on-one chat with a random user', 
    icon: MessageCircle 
  },
];

const JoinRoom: React.FC<JoinRoomProps> = ({ 
  user, 
  onJoin, 
  onSignOut, 
  connected = false,
  reconnecting = false,
  error = null,
  privateRoomCode = null,
  onBackToLogin
}) => {
  const [customRoom, setCustomRoom] = useState('');
  const [privateCode, setPrivateCode] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(privateRoomCode);
  const [searchingForMatch, setSearchingForMatch] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const greeting = getGreeting();
  const { toast } = useToast();

  const handleJoinPreset = (roomId: string) => {
    console.log(`Joining preset room: ${roomId}`, user);
    
    if (roomId === 'random') {
      setSearchingForMatch(true);
      
      if (user) {
        const updatedUser = { ...user, searchingForMatch: true };
        if (useAuth().setUser) {
          useAuth().setUser(updatedUser);
        }
      }
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 2;
        setSearchProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      setTimeout(() => {
        onJoin(roomId);
        setSearchingForMatch(false);
        clearInterval(progressInterval);
      }, 3000);
      
      toast({
        description: "Looking for a random match...",
        duration: 3000,
      });
    } else {
      onJoin(roomId);
      
      if (!connected) {
        toast({
          variant: "destructive",
          title: "Connection Warning",
          description: "Using fallback mode. Your ability to connect with others may be limited.",
          duration: 5000,
        });
      } else {
        toast({
          description: `Joining ${roomId === 'general' ? 'general chat room' : 'random match'}...`,
          duration: 3000,
        });
      }
    }
  };

  const handleJoinCustom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customRoom.trim()) return;
    
    const privateRoomCode = generateId().substring(0, 6).toUpperCase();
    setCreatedRoomCode(privateRoomCode);
    
    const roomId = `private-${privateRoomCode}-${customRoom.trim().toLowerCase().replace(/\s+/g, '-')}`;
    console.log(`Creating private room: ${roomId}`, user);
    onJoin(roomId);
    setCustomRoom('');
    
    if (!connected) {
      toast({
        variant: "destructive",
        title: "Connection Warning",
        description: "Using fallback mode. Your ability to connect with others may be limited.",
        duration: 5000,
      });
    } else {
      toast({
        description: `Created private room: ${customRoom}`,
        duration: 3000,
      });
    }
  };

  const handleJoinPrivate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privateCode.trim()) return;
    
    const roomCode = privateCode.trim().toUpperCase();
    const roomId = `private-${roomCode}`;
    console.log(`Joining private room with code: ${roomCode}`, user);
    onJoin(roomId);
    setPrivateCode('');
    
    if (!connected) {
      toast({
        variant: "destructive",
        title: "Connection Warning",
        description: "Using fallback mode. Your ability to connect with others may be limited.",
        duration: 5000,
      });
    } else {
      toast({
        description: `Joining private room with code: ${roomCode}`,
        duration: 3000,
      });
    }
  };

  const handleSignOut = () => {
    onSignOut();
    toast({
      description: user.isGuest ? "Exited guest mode" : "Signed out successfully",
      duration: 3000,
    });
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
      toast({
        description: "Returned to login screen",
        duration: 3000,
      });
    }
  };

  const handleCopyRoomCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      toast({
        description: "Room code copied to clipboard",
        duration: 3000,
      });
    }
  };

  const handleCancelSearch = () => {
    setSearchingForMatch(false);
    setSearchProgress(0);
    
    if (user) {
      const updatedUser = { ...user, searchingForMatch: false };
      if (useAuth().setUser) {
        useAuth().setUser(updatedUser);
      }
    }
    
    toast({
      description: "Search cancelled",
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 animate-fade-in bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-[340px] sm:max-w-md text-center mb-4 sm:mb-6 px-2">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">Verbo</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Real-time messaging, simplified</p>
      </div>
      
      {!connected && (
        <div className="w-full max-w-[340px] sm:max-w-md mb-4 px-2 py-3 bg-yellow-100 border border-yellow-300 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">
              {reconnecting ? "Attempting to reconnect..." : "Using offline mode"}
            </p>
            <p className="text-xs text-yellow-700">
              {error || "Connection to chat server is unavailable. Some features may be limited."}
            </p>
          </div>
        </div>
      )}
      
      {createdRoomCode && (
        <div className="w-full max-w-[340px] sm:max-w-md mb-4 px-4 py-3 bg-indigo-100 border border-indigo-300 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-indigo-800 font-medium">Private Room Code</p>
                <p className="text-sm font-semibold text-indigo-900">{createdRoomCode}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleCopyRoomCode}
              className="h-8 w-8 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-200"
            >
              <Copy size={16} />
            </Button>
          </div>
          <p className="text-xs text-indigo-700 mt-1">
            Share this code with others so they can join your private room
          </p>
        </div>
      )}
      
      {searchingForMatch && (
        <div className="w-full max-w-[340px] sm:max-w-md mb-4 px-4 py-4 bg-violet-100 border border-violet-300 rounded-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-violet-200 text-violet-700">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-violet-800">Looking for a match</h3>
              <p className="text-xs text-violet-700">Searching for someone to chat with...</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={searchProgress} className="h-2" indicatorClassName="bg-violet-500" />
            <div className="flex justify-between">
              <span className="text-xs text-violet-700">Searching</span>
              <span className="text-xs text-violet-700">{searchProgress}%</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelSearch}
            className="w-full mt-4 border-violet-300 text-violet-700 hover:bg-violet-200"
          >
            Cancel Search
          </Button>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full bg-violet-200/50" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20 bg-violet-200/50" />
                <Skeleton className="h-2 w-32 bg-violet-200/50" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full bg-violet-200/50" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24 bg-violet-200/50" />
                <Skeleton className="h-2 w-28 bg-violet-200/50" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Card className="w-full max-w-[340px] sm:max-w-md shadow-xl overflow-hidden border border-gray-100 bg-white/80 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 z-0"></div>
        
        <CardHeader className="relative z-10 text-center border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {onBackToLogin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToLogin} 
                  className="text-gray-500 hover:text-gray-700"
                  title="Back to Login"
                >
                  <ArrowLeft size={18} />
                </Button>
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl flex-grow truncate px-2">{greeting}, {user.name}</CardTitle>
            <div className="flex-1 flex justify-end">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut} 
                className="text-gray-500 hover:text-gray-700"
                title={user.isGuest ? "Exit Guest Mode" : "Sign Out"}
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
          <CardDescription className="text-sm mt-1">Join a chat room or create your own</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 relative z-10 px-4 sm:px-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Available Chat Rooms</h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_ROOMS.map((room) => {
                const Icon = room.icon;
                return (
                  <Button
                    key={room.id}
                    variant="outline"
                    className="w-full justify-between h-auto py-2.5 sm:py-3 px-3 sm:px-4 transition-all hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-indigo-500/10 hover:border-violet-200 group"
                    onClick={() => handleJoinPreset(room.id)}
                    disabled={searchingForMatch}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="bg-violet-100 p-1.5 sm:p-2 rounded-full">
                        <Icon size={14} className="text-violet-600" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm sm:text-base">{room.name}</span>
                        <span className="text-xs text-muted-foreground">{room.desc}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Join →
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex space-x-2 mb-2">
              <Button
                type="button"
                variant={activeTab === 'create' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 ${activeTab === 'create' ? 'bg-gradient-to-r from-violet-500 to-purple-600' : ''}`}
                onClick={() => setActiveTab('create')}
                disabled={searchingForMatch}
              >
                Create Room
              </Button>
              <Button
                type="button"
                variant={activeTab === 'join' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 ${activeTab === 'join' ? 'bg-gradient-to-r from-violet-500 to-purple-600' : ''}`}
                onClick={() => setActiveTab('join')}
                disabled={searchingForMatch}
              >
                Join Private
              </Button>
            </div>
            
            {activeTab === 'create' ? (
              <form onSubmit={handleJoinCustom} className="flex space-x-2">
                <Input
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  placeholder="Enter room name"
                  className="flex-1 text-sm"
                  disabled={searchingForMatch}
                />
                <Button 
                  type="submit" 
                  disabled={!customRoom.trim() || searchingForMatch}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-sm whitespace-nowrap"
                >
                  Create
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoinPrivate} className="flex space-x-2">
                <Input
                  value={privateCode}
                  onChange={(e) => setPrivateCode(e.target.value)}
                  placeholder="Enter room code"
                  className="flex-1 text-sm"
                  disabled={searchingForMatch}
                />
                <Button 
                  type="submit" 
                  disabled={!privateCode.trim() || searchingForMatch}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-sm whitespace-nowrap"
                >
                  Join
                </Button>
              </form>
            )}
            
            {activeTab === 'join' && (
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <Key size={12} className="mr-1.5" />
                <span>Use a code shared by others to join their private room</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-2 pb-3 sm:pb-4 text-xs relative z-10 border-t border-gray-100 bg-gray-50/50">
          <ConnectionStatus connected={connected} reconnecting={reconnecting} error={error} showText />
        </CardFooter>
      </Card>
    </div>
  );
};

export default JoinRoom;
