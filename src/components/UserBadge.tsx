
import React from 'react';
import { User } from '@/utils/messageUtils';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserBadgeProps {
  user: User;
  onClick?: () => void;
}

const UserBadge = ({ user, onClick }: UserBadgeProps) => {
  const isOnline = user.online;
  
  return (
    <div 
      className={`flex items-center space-x-3 p-2.5 rounded-md transition-colors duration-200 ${onClick ? 'cursor-pointer hover:bg-accent/50' : ''}`}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
          <AvatarImage src={user.photoURL} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
            {user.name[0]}
          </AvatarFallback>
        </Avatar>
        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'} shadow-sm`}></span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold truncate max-w-[120px]">{user.name}</span>
        <span className="text-xs text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
};

export default UserBadge;
