
import React, { memo } from 'react';
import { User } from '@/utils/messageUtils';
import Poll, { PollData } from './Poll';

interface PollMessageProps {
  pollData: PollData;
  currentUser: User;
  onVote: (pollId: string, optionId: string) => void;
}

const PollMessage: React.FC<PollMessageProps> = ({
  pollData,
  currentUser,
  onVote
}) => {
  // Add explicit logging to trace the vote path
  const handleVote = (pollId: string, optionId: string) => {
    console.log("PollMessage: handling vote for poll", pollId, "option", optionId);
    // Ensure the vote gets passed up correctly
    onVote(pollId, optionId);
  };

  return (
    <div className="w-full max-w-sm">
      <Poll 
        pollData={pollData}
        currentUser={currentUser}
        onVote={handleVote}
      />
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(PollMessage);
