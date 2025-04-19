
import React from 'react';
import { User, Reaction } from '@/utils/messageUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, Heart, ThumbsUp, Laugh, Angry, Frown } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onAddReaction: (messageId: string, reaction: string) => void;
  user: User;
}

const REACTIONS = [
  { emoji: "❤️", icon: Heart, name: "heart" },
  { emoji: "👍", icon: ThumbsUp, name: "thumbs-up" },
  { emoji: "😂", icon: Laugh, name: "laugh" },
  { emoji: "😢", icon: Frown, name: "sad" },
  { emoji: "😡", icon: Angry, name: "angry" },
];

const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  reactions = [], 
  onAddReaction,
  user
}) => {
  console.log("Rendering MessageReactions with reactions:", reactions);
  
  // Get user's current reaction if any
  const userCurrentReaction = reactions.find(reaction => 
    reaction.user?.id === user.id
  )?.reaction;
  
  // Group reactions by type and count them
  const getReactionCounts = () => {
    // Create a map to track users who reacted with each emoji
    const reactionMap: Record<string, Set<string>> = {};
    
    reactions.forEach(reaction => {
      // Check if the reaction and user are valid
      if (reaction.reaction && reaction.user?.id) {
        // Initialize the set if it doesn't exist
        if (!reactionMap[reaction.reaction]) {
          reactionMap[reaction.reaction] = new Set();
        }
        
        // Add user ID to the set for this reaction
        reactionMap[reaction.reaction].add(reaction.user.id);
      }
    });
    
    // Convert to counts object
    const counts: Record<string, number> = {};
    for (const [reaction, users] of Object.entries(reactionMap)) {
      counts[reaction] = users.size;
    }
    
    return counts;
  };
  
  const reactionCounts = getReactionCounts();
  
  const handleAddReaction = (reaction: string) => {
    console.log("Adding reaction:", reaction, "to message:", messageId);
    
    if (userCurrentReaction === reaction) {
      // If user already reacted with this emoji, treat it as a toggle (remove)
      onAddReaction(messageId, reaction); // This will be handled by the backend to toggle
    } else {
      // Add the new reaction
      onAddReaction(messageId, reaction);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {/* Display existing reactions with counts */}
      {Object.entries(reactionCounts).map(([reaction, count]) => {
        // Check if the current user has reacted with this emoji
        const isUserReaction = userCurrentReaction === reaction;
        
        return (
          <Button
            key={reaction}
            variant="ghost"
            size="sm"
            className={`h-6 px-2 rounded-full text-xs ${
              isUserReaction 
                ? "bg-violet-100 hover:bg-violet-200" 
                : "bg-background/80 hover:bg-background"
            }`}
            onClick={() => handleAddReaction(reaction)}
          >
            {reaction} <span className="ml-1">{count}</span>
          </Button>
        );
      })}
      
      {/* Reaction picker */}
      <Popover>
        <PopoverTrigger>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full bg-background/80 hover:bg-background"
          >
            <Smile size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 flex gap-1">
          {REACTIONS.map((reaction) => (
            <Button
              key={reaction.name}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
              onClick={() => handleAddReaction(reaction.emoji)}
            >
              {reaction.emoji}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;
