
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
  // Group reactions by emoji and count users
  const getReactionCounts = () => {
    const reactionMap: Record<string, string[]> = {};
    
    reactions.forEach(reaction => {
      const emoji = reaction.emoji;
      
      if (!reactionMap[emoji]) {
        reactionMap[emoji] = [];
      }
      
      reactionMap[emoji].push(reaction.userId);
    });
    
    return reactionMap;
  };
  
  const reactionCounts = getReactionCounts();
  
  const handleAddReaction = (emoji: string) => {
    console.log("Adding reaction:", emoji, "to message:", messageId);
    onAddReaction(messageId, emoji);
  };
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {/* Display existing reactions with counts */}
      {Object.entries(reactionCounts).map(([emoji, userIds]) => {
        // Check if the current user has reacted with this emoji
        const isUserReaction = userIds.includes(user.id);
        
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={`h-6 px-2 rounded-full text-xs ${
              isUserReaction 
                ? "bg-violet-100 hover:bg-violet-200" 
                : "bg-background/80 hover:bg-background"
            }`}
            onClick={() => handleAddReaction(emoji)}
          >
            {emoji} <span className="ml-1">{userIds.length}</span>
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
