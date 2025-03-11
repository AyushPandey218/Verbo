
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  PenTool, 
  Plus,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Poll, { PollData } from './Poll';
import { User } from '@/utils/messageUtils';

interface ActionToolbarProps {
  onStartWhiteboard: () => void;
  onCreatePoll: (pollData: Omit<PollData, 'id' | 'createdAt'>) => void;
  currentUser: User;
  roomId: string;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onStartWhiteboard,
  onCreatePoll,
  currentUser,
  roomId,
}) => {
  const [isPollOpen, setIsPollOpen] = useState(false);

  const handleCreatePoll = (pollData: Omit<PollData, 'id' | 'createdAt'>) => {
    onCreatePoll(pollData);
    setIsPollOpen(false);
  };

  const handleWhiteboardClick = (e: React.MouseEvent) => {
    // Prevent the event from bubbling up to the form
    e.preventDefault();
    e.stopPropagation();
    onStartWhiteboard();
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button" 
              variant="ghost"
              size="sm"
              onClick={handleWhiteboardClick}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex gap-1.5 items-center"
            >
              <PenTool size={16} />
              <span className="hidden md:inline text-sm">Whiteboard</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Whiteboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Popover open={isPollOpen} onOpenChange={setIsPollOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex gap-1.5 items-center"
                >
                  <BarChart size={16} />
                  <span className="hidden md:inline text-sm">Create Poll</span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Poll</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-80 p-0" align="end">
          <Poll
            pollData={{
              id: '',
              question: '',
              options: [],
              createdBy: currentUser.id,
              createdAt: Date.now(),
              roomId,
            }}
            currentUser={currentUser}
            onVote={() => {}}
            isCreating={true}
            onCreatePoll={handleCreatePoll}
            onClose={() => setIsPollOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ActionToolbar;
