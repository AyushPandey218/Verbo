import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, PenTool, BarChart, Smile, Image, Gift } from 'lucide-react';
import VoiceMessageRecorder from './VoiceMessageRecorder';
import Poll, { PollData } from './Poll';
import ActionToolbar from './ActionToolbar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from './ui/use-toast';
import TenorPicker from './TenorPicker';

interface MessageInputProps {
  onSend: (content: string) => void;
  onSendVoice: (blob: Blob, audioUrl: string) => void;
  onSendWhiteboardData?: (data: any) => void;
  onSendPoll?: (pollData: Omit<PollData, 'id' | 'createdAt'>) => void;
  currentUser?: any;
  roomId?: string;
  onOpenWhiteboard?: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  onSendVoice, 
  onSendWhiteboardData,
  onSendPoll,
  currentUser,
  roomId,
  onOpenWhiteboard,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSubmitting && !disabled) {
      setIsSubmitting(true);
      const currentMessage = message.trim();
      setMessage(''); // Clear input immediately for better UX
      
      try {
        setTimeout(() => {
          onSend(currentMessage);
        }, 50);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessage(currentMessage);
      } finally {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 500);
      }
    }
  };

  const handleWhiteboardClick = () => {
    if (onOpenWhiteboard) {
      onOpenWhiteboard();
    }
    setIsRecording(false);
    setIsPollOpen(false);
  };

  const handlePollClick = () => {
    setIsPollOpen(true);
    setIsRecording(false);
  };

  const handleVoiceMessageClick = () => {
    if (!isSubmitting && !disabled && !isRecording) {
      setIsRecording(true);
      setIsPollOpen(false);
    }
  };
  
  const handleVoiceMessageComplete = (blob: Blob, audioUrl: string) => {
    if (isSubmitting || disabled) return;
    
    setIsSubmitting(true);
    
    try {
      toast({
        description: "Sending voice message...",
        duration: 3000,
      });
      
      setTimeout(() => {
        onSendVoice(blob, audioUrl);
      }, 50);
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send voice message. Please try again.",
        duration: 3000,
      });
    } finally {
      setIsRecording(false);
      
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  const handleSendGif = (gifUrl: string) => {
    if (!isSubmitting && !disabled) {
      setIsSubmitting(true);
      
      try {
        console.log("Sending GIF with URL:", gifUrl);
        setTimeout(() => {
          onSend(`[GIF](${gifUrl})`);
        }, 50);
      } catch (error) {
        console.error("Error sending GIF:", error);
      } finally {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 500);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const commonEmojis = ['😊', '👍', '❤️', '😂', '🙌', '🎉', '🔥', '👏', '😍', '🤔', '😮', '👋', '🙏', '✅', '⭐'];

  return (
    <div className="p-3 bg-white shadow-sm w-full transition-all duration-300 ease-in-out">
      {isRecording ? (
        <VoiceMessageRecorder
          onVoiceMessageRecorded={handleVoiceMessageComplete}
          onCancel={() => setIsRecording(false)}
        />
      ) : isPollOpen && onSendPoll && currentUser && roomId ? (
        <Poll
          pollData={{
            id: '',
            question: '',
            options: [],
            createdBy: currentUser.id,
            createdAt: 0,
            roomId: roomId
          }}
          currentUser={currentUser}
          onVote={() => {}}
          isCreating={true}
          onCreatePoll={(pollData) => {
            if (onSendPoll) {
              onSendPoll(pollData);
              setIsPollOpen(false);
            }
          }}
          onClose={() => setIsPollOpen(false)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-10 rounded-full h-11 border-1 border-indigo-100 focus-visible:ring-indigo-200 shadow-sm pl-4"
              disabled={disabled || isSubmitting}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                  >
                    <Smile size={18} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 shadow-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Quick Emoji</div>
                  <div className="grid grid-cols-5 gap-1">
                    {commonEmojis.map((emoji) => (
                      <Button
                        key={emoji}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            <TooltipProvider>
              {onSendWhiteboardData && onOpenWhiteboard && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handleWhiteboardClick}
                      disabled={disabled || isSubmitting}
                      className="rounded-full h-10 w-10 bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <PenTool size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Whiteboard</TooltipContent>
                </Tooltip>
              )}
              
              {onSendPoll && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handlePollClick}
                      disabled={disabled || isSubmitting}
                      className="rounded-full h-10 w-10 bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <BarChart size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Create Poll</TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleVoiceMessageClick}
                    disabled={disabled || isSubmitting}
                    className="rounded-full h-10 w-10 bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Mic size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Voice Message</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TenorPicker onSelect={handleSendGif} />
                </TooltipTrigger>
                <TooltipContent side="top">GIF</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!message.trim() || isSubmitting || disabled} 
                    className="rounded-full h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm"
                  >
                    <Send size={16} className="text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Send</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      )}
    </div>
  );
};

export default MessageInput;
