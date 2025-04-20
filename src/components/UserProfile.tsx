import React, { useState } from 'react';
import { User } from '@/utils/messageUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { LogOut, UserPlus, Users, Mail, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileProps {
  user: User;
  onSignOut: () => void;
  onAddFriend: (email: string) => void;
  friends: User[];
  pendingRequests?: any[];
  onClose?: () => void;
  onBackToGreeting?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  onSignOut,
  onAddFriend,
  friends = [],
  pendingRequests = [],
  onClose,
  onBackToGreeting
}) => {
  const [friendEmail, setFriendEmail] = useState('');
  const { toast } = useToast();

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!friendEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a friend's email address",
        variant: "destructive"
      });
      return;
    }
    
    onAddFriend(friendEmail.trim());
    setFriendEmail('');
    
    toast({
      title: "Friend request sent",
      description: "We'll notify you when they accept",
    });
  };

  const handleSignOut = () => {
    if (onClose) {
      onClose();
    } else {
      onSignOut();
    }
  };
  
  const handleBackToGreeting = () => {
    if (onBackToGreeting) {
      onBackToGreeting();
      toast({
        description: "Returned to room selection",
        duration: 3000,
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col items-center mt-2 space-y-3 bg-gradient-to-b from-indigo-50 to-white p-4 rounded-lg">
        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
          <AvatarImage src={user.photoURL} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-medium">{user.name}</h3>
        <div className="flex items-center text-sm text-muted-foreground gap-1">
          <Mail className="h-3.5 w-3.5" />
          <span>{user.email}</span>
        </div>
        
        {user.isGuest && (
          <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
            Guest User
          </div>
        )}
        
        {user.lastActive && (
          <div className="flex items-center text-xs text-gray-500 gap-1.5 mt-1">
            <Clock className="h-3 w-3" />
            <span>Active {formatDistanceToNow(user.lastActive, { addSuffix: true })}</span>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="friends" className="mt-4 flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-4 space-y-4 overflow-auto max-h-[300px]">
          {!user.isGuest && (
            <form onSubmit={handleAddFriend} className="flex space-x-2">
              <Input
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Friend's email"
                className="flex-1"
              />
              <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700">
                <UserPlus size={18} />
              </Button>
            </form>
          )}
          
          <div className="space-y-2">
            {friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-indigo-50 transition-all">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.photoURL} alt={friend.name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                        {friend.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {friend.online ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-300 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{friend.name}</span>
                    <span className="text-xs text-muted-foreground">{friend.online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-muted-foreground bg-gray-50 rounded-lg">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No friends yet</p>
                {!user.isGuest && (
                  <p className="text-xs mt-1">Add friends using their email</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4 space-y-4 overflow-auto max-h-[300px]">
          {pendingRequests.length > 0 ? (
            pendingRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-2 rounded-md hover:bg-indigo-50 transition-all">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={request.from.photoURL} alt={request.from.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                      {request.from.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{request.from.name}</span>
                    <span className="text-xs text-muted-foreground">{request.from.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">Accept</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-gray-500">Decline</Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-muted-foreground bg-gray-50 rounded-lg">
              <UserPlus className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No pending requests</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 pt-4 border-t space-y-2">
        {onBackToGreeting && (
          <Button variant="outline" onClick={handleBackToGreeting} className="w-full gap-2 border-indigo-200 text-indigo-700">
            <ArrowLeft size={16} />
            <span>Back to Room Selection</span>
          </Button>
        )}
        <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
          <LogOut size={16} />
          <span>{user.isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
