
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

// Additional utility for checking if a user is available for matching
export const isUserAvailableForMatching = (user: User): boolean => {
  return user.online === true && !user.inRandomChat;
};

// Utility for creating a unique room ID for two users
export const createRandomChatRoomId = (user1Id: string, user2Id: string): string => {
  // Sort IDs to ensure the same room ID regardless of order
  const sortedIds = [user1Id, user2Id].sort();
  return `random-${sortedIds[0]}-${sortedIds[1]}`;
};