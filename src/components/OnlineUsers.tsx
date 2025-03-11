import React, { useState, useEffect } from 'react';
import { User } from '@/utils/messageUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ConnectionStatus from './ConnectionStatus';
import { UserPlus, UserRoundX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { USER_ONLINE_TIMEOUT } from '@/utils/config';

interface OnlineUsersProps {
  users: User[];
  connected?: boolean;
  onSelectUser?: (user: User) => void;
  showText?: boolean;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ 
  users, 
  connected = false,
  onSelectUser,
  showText = false
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'all'>('online');
  const [offlineUsers, setOfflineUsers] = useState<User[]>([]);
  
  // Clear cache on component mount
  useEffect(() => {
    localStorage.removeItem('onlineUsersCache');
  }, []);
  
  // Filter for strictly online users (with online=true AND active timestamp)
  const onlineUsersList = users.filter(user => {
    // User must explicitly have online=true
    if (user.online !== true) return false;
    
    // Check if user has been active recently
    const now = Date.now();
    if (user.lastActive && (now - user.lastActive > USER_ONLINE_TIMEOUT)) {
      return false;
    }
    
    return true;
  });
  
  // Track offline users
  useEffect(() => {
    const currentTime = Date.now();
    const onlineUserIds = new Set(onlineUsersList.map(user => user.id));
    
    setOfflineUsers(prev => {
      // Keep offline users that aren't now online and haven't timed out completely
      const filteredOffline = prev.filter(user => {
        const isNowOnline = onlineUserIds.has(user.id);
        const hasTimedOut = user.leftAt && (currentTime - user.leftAt > USER_ONLINE_TIMEOUT * 3);
        return !isNowOnline && !hasTimedOut;
      });
      
      // Add new offline users (users that are explicitly offline)
      const newOfflineUsers = users.filter(user => {
        const isExplicitlyOffline = user.online === false;
        const notInOfflineList = !filteredOffline.some(offlineUser => offlineUser.id === user.id);
        return isExplicitlyOffline && notInOfflineList;
      });
      
      return [...filteredOffline, ...newOfflineUsers];
    });
  }, [users, onlineUsersList]);
  
  // Combine online and offline users for the "All" tab, ensuring no duplicates
  const allUsers = [...onlineUsersList];
  offlineUsers.forEach(offlineUser => {
    if (!onlineUsersList.some(user => user.id === offlineUser.id)) {
      allUsers.push(offlineUser);
    }
  });
  
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 flex items-center justify-between">
        <h3 className="text-indigo-700 font-medium">Users</h3>
        <Badge variant="outline" className={`${connected ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      
      <Tabs defaultValue="online" className="w-full" onValueChange={(value) => setActiveTab(value as 'online' | 'all')}>
        <TabsList className="grid w-full grid-cols-2 p-1 bg-indigo-50">
          <TabsTrigger value="online" className="data-[state=active]:bg-white">
            Online ({onlineUsersList.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All ({allUsers.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="online" className="mt-0">
          <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
            {onlineUsersList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <UserPlus className="h-8 w-8 mx-auto text-indigo-200 mb-2" />
                <p>No users online</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {onlineUsersList.map((user) => (
                  <li 
                    key={user.id}
                    className="p-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => onSelectUser && onSelectUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={user.photoURL} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email || 'Guest User'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
            {allUsers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <UserRoundX className="h-8 w-8 mx-auto text-indigo-200 mb-2" />
                <p>No users found</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {allUsers.map((user) => (
                  <li 
                    key={user.id}
                    className="p-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => onSelectUser && onSelectUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={user.photoURL} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {user.online === true ? (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-300 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email || 'Guest User'}
                        </p>
                        {user.online === false && (
                          <p className="text-xs text-gray-400">Offline</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="border-t p-3 bg-gray-50">
        <ConnectionStatus connected={connected} showText={true} />
      </div>
    </div>
  );
};

export default OnlineUsers;
