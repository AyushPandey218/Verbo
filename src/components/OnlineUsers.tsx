
import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User } from '@/utils/messageUtils';
import { User as UserIcon, Clock, Search } from 'lucide-react';
import { formatTimestamp } from '@/utils/messageUtils';
// Add USER_ONLINE_TIMEOUT directly to the component since it's missing from config
const USER_ONLINE_TIMEOUT = 60000; // 60 seconds
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OnlineUsersProps {
  users: User[];
  connected?: boolean;
  onSelectUser?: (user: User) => void;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ 
  users, 
  connected = true,
  onSelectUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const handleSelectUser = (user: User) => {
    if (onSelectUser) {
      onSelectUser(user);
    }
  };

  const isUserOnline = (user: User) => {
    if (user.online) return true;
    if (!user.lastSeen) return false;
    
    const now = Date.now();
    return (now - user.lastSeen) < USER_ONLINE_TIMEOUT;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {connected ? (
          filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={user.photoURL} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email || "Guest user"}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${isUserOnline(user) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs text-muted-foreground">{isUserOnline(user) ? 'Online' : 'Away'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              <UserIcon className="mx-auto h-10 w-10 mb-2 opacity-30" />
              <p>No users found</p>
            </div>
          )
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            <Clock className="mx-auto h-10 w-10 mb-2 opacity-30" />
            <p>Connecting...</p>
            <p className="text-xs mt-1">Showing offline data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
