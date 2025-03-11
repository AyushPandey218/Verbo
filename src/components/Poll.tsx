
import React, { useState, useEffect } from 'react';
import { BarChart, ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { User } from '@/utils/messageUtils';

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // Array of user IDs who voted for this option
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: number;
  roomId: string;
  isMultipleChoice?: boolean;
}

interface PollProps {
  pollData: PollData;
  currentUser: User;
  onVote: (pollId: string, optionId: string) => void;
  isCreating?: boolean;
  onCreatePoll?: (pollData: Omit<PollData, 'id' | 'createdAt'>) => void;
  onClose?: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const Poll: React.FC<PollProps> = ({
  pollData,
  currentUser,
  onVote,
  isCreating = false,
  onCreatePoll,
  onClose
}) => {
  const [newPoll, setNewPoll] = useState<{
    question: string;
    options: { id: string; text: string }[];
    isMultipleChoice: boolean;
  }>({
    question: '',
    options: [
      { id: generateId(), text: '' },
      { id: generateId(), text: '' }
    ],
    isMultipleChoice: false
  });

  // Remove internal hasVoted state and calculate directly from pollData
  // This ensures reactivity based on the latest data

  const handleVote = (optionId: string) => {
    console.log("Poll component: Voting for option", optionId, "in poll", pollData.id);
    onVote(pollData.id, optionId);
  };

  const handleAddOption = () => {
    if (newPoll.options.length >= 8) return;
    
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { id: generateId(), text: '' }]
    });
  };

  const handleRemoveOption = (id: string) => {
    if (newPoll.options.length <= 2) return;
    
    setNewPoll({
      ...newPoll,
      options: newPoll.options.filter(opt => opt.id !== id)
    });
  };

  const handleOptionChange = (id: string, text: string) => {
    setNewPoll({
      ...newPoll,
      options: newPoll.options.map(opt => 
        opt.id === id ? { ...opt, text } : opt
      )
    });
  };

  const handleCreatePoll = () => {
    if (!onCreatePoll) return;
    
    if (!newPoll.question.trim()) return;
    if (newPoll.options.some(opt => !opt.text.trim())) return;
    
    onCreatePoll({
      question: newPoll.question,
      options: newPoll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: []
      })),
      createdBy: currentUser.id,
      roomId: pollData.roomId,
      isMultipleChoice: newPoll.isMultipleChoice
    });
    
    if (onClose) onClose();
  };

  if (!isCreating) {
    const totalVotes = pollData.options.reduce((sum, option) => {
      return sum + (option.votes ? option.votes.length : 0);
    }, 0);
    
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart size={18} className="text-violet-500" />
          <h3 className="font-medium">{pollData.question}</h3>
        </div>
        
        <div className="space-y-3 mb-3">
          {pollData.options.map(option => {
            const voteCount = option.votes ? option.votes.length : 0;
            const votePercentage = totalVotes > 0 
              ? Math.round((voteCount / totalVotes) * 100) 
              : 0;
            
            const hasUserVoted = option.votes && option.votes.includes(currentUser.id);
            
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{option.text}</span>
                    {hasUserVoted && (
                      <CheckCircle2 size={14} className="text-green-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{votePercentage}% ({voteCount})</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Progress value={votePercentage} className="flex-1" />
                  
                  <Button 
                    variant={hasUserVoted ? "default" : "ghost"}
                    size="sm" 
                    onClick={() => handleVote(option.id)}
                    className="h-7 px-2"
                  >
                    <ThumbsUp size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Total votes: {totalVotes}</span>
          <span>Created by {pollData.createdBy === currentUser.id ? 'you' : 'someone else'}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart size={18} className="text-violet-500" />
          <h3 className="font-medium">Create a Poll</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium mb-1">
            Question
          </label>
          <Input
            id="question"
            value={newPoll.question}
            onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
            placeholder="Ask a question..."
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Options
          </label>
          <div className="space-y-2">
            {newPoll.options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
                {newPoll.options.length > 2 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveOption(option.id)}
                    className="h-8 w-8"
                  >
                    <ThumbsDown size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={newPoll.options.length >= 8}
          >
            Add Option
          </Button>
          
          <Button
            onClick={handleCreatePoll}
            disabled={!newPoll.question.trim() || 
                     newPoll.options.some(opt => !opt.text.trim())}
          >
            Create Poll
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Poll;
