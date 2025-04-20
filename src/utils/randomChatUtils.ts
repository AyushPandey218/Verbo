
import { User } from './messageUtils';

export const findRandomMatch = (users: User[], currentUserId: string): User | null => {
  // Filter out the current user and offline users
  const availableUsers = users.filter(user => 
    user.id !== currentUserId && 
    user.online === true
  );
  
  if (availableUsers.length === 0) {
    return null;
  }
  
  // Randomly select a user from available users
  const randomIndex = Math.floor(Math.random() * availableUsers.length);
  return availableUsers[randomIndex];
};