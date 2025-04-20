import React from 'react';
import { User } from '@/utils/messageUtils';

export interface PollData {
  id: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[];
  createdBy: string;
  createdAt: number;
  roomId: string;
}

interface PollMessageProps {
  pollData: PollData;
  currentUser: User;
  onVote: (pollId: string, optionId: string) => void;
  isCreating?: boolean;
  onCreatePoll?: (pollData: Omit<PollData, 'id' | 'createdAt'>) => void;
  onClose?: () => void;
}

const PollMessage: React.FC<PollMessageProps> = ({ 
  pollData, 
  currentUser, 
  onVote,
  isCreating = false,
  onCreatePoll,
  onClose
}) => {
  // Simple placeholder implementation
  return (
    <div className="p-3">
      <h3 className="font-medium text-sm">{pollData.question || "Poll"}</h3>
      <div className="mt-2 space-y-2">
        {pollData.options.map(option => (
          <button 
            key={option.id}
            className="w-full text-left p-2 border rounded-md hover:bg-gray-50 text-sm"
            onClick={() => onVote(pollData.id, option.id)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PollMessage;
