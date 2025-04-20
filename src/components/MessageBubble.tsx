import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Message, User } from '@/utils/messageUtils';
import { formatTimestamp } from '@/utils/messageUtils';
import MessageReactions from './MessageReactions';
import PollMessage from './PollMessage';
import { Volume2, PlayCircle, PauseCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import MessageInsights from './MessageInsights';

interface MessageBubbleProps {
  message: Message;
  user: User;
  onAddReaction: (messageId: string, reaction: string) => void;
  onVotePoll?: (pollId: string, optionId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, user, onAddReaction, onVotePoll }) => {
  const [showActions, setShowActions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioProgressRef = useRef<number>(0);
  const audioIntervalRef = useRef<number | null>(null);
  
  const isSender = message.sender.id === user.id;
  
  const isPollMessage = message.content?.startsWith('__POLL__:');
  const isGifMessage = typeof message.content === 'string' && message.content.startsWith('[GIF](') && message.content.endsWith(')');
  
  let pollData = null;
  if (isPollMessage && onVotePoll) {
    try {
      const jsonString = message.content.replace('__POLL__:', '');
      pollData = JSON.parse(jsonString);
      console.log("Successfully parsed poll data:", pollData);
    } catch (e) {
      console.error('Error parsing poll data:', e);
    }
  }
  
  // Extract GIF URL if it's a GIF message
  const gifUrl = isGifMessage 
    ? message.content.substring(5, message.content.length - 1)
    : null;

  useEffect(() => {
    if (message.isVoiceMessage && message.voiceUrl) {
      console.log("Voice message URL in MessageBubble:", message.voiceUrl);
      const audio = new Audio(message.voiceUrl);
      setAudioElement(audio);
      
      audio.addEventListener('loadedmetadata', () => {
        console.log("Audio duration loaded:", audio.duration);
        setAudioDuration(audio.duration);
      });
      
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(progress);
        audioProgressRef.current = progress;
      });
      
      const handleEnded = () => {
        setIsPlaying(false);
        setAudioProgress(0);
        if (audioIntervalRef.current) {
          window.clearInterval(audioIntervalRef.current);
          audioIntervalRef.current = null;
        }
      };
      
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        if (audioIntervalRef.current) {
          window.clearInterval(audioIntervalRef.current);
        }
      };
    }
  }, [message.isVoiceMessage, message.voiceUrl]);

  const toggleAudio = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
      if (audioIntervalRef.current) {
        window.clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    } else {
      audioElement.play().catch(err => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div 
      className={`group flex gap-3 ${isSender ? 'flex-row-reverse' : ''} animate-fade-in`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex-shrink-0 mt-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={`h-8 w-8 border transition-all ${isSender ? 'border-violet-200' : 'border-gray-200'}`}>
                {message.sender.photoURL ? (
                  <AvatarImage src={message.sender.photoURL} alt={message.sender.name} />
                ) : (
                  <AvatarFallback className={isSender ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' : 'bg-gray-200'}>
                    {message.sender.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side={isSender ? "left" : "right"} align="center" className="bg-gray-900 text-white text-xs">
              {message.sender.name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.sender.name}</span>
          <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
        </div>
        
        {isPollMessage && pollData ? (
          <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
            <PollMessage
              pollData={pollData}
              currentUser={user}
              onVote={(pollId, optionId) => {
                console.log("MessageBubble: Vote on poll", pollId, "option", optionId);
                if (onVotePoll) {
                  onVotePoll(pollId, optionId);
                }
              }}
            />
          </div>
        ) : message.isVoiceMessage ? (
          <div className={`rounded-2xl p-3 ${
            isSender 
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' 
              : 'bg-white border border-gray-100 shadow-sm'
          } min-w-[180px] sm:min-w-[220px] transition-all`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleAudio}
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isSender 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-violet-100 hover:bg-violet-200'
                } transition-colors`}
                aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
              >
                {isPlaying ? (
                  <PauseCircle size={18} className={isSender ? 'text-white' : 'text-violet-600'} />
                ) : (
                  <PlayCircle size={18} className={isSender ? 'text-white' : 'text-violet-600'} />
                )}
              </button>
              
              <div className="flex-1">
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 mb-1.5">
                  <div 
                    className={`h-full ${isSender ? 'bg-white' : 'bg-violet-600'}`} 
                    style={{ width: `${audioProgress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center gap-0.5 h-6 opacity-80">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 rounded-full ${
                        isSender ? 'bg-white/80' : 'bg-violet-400/80'
                      } ${isPlaying ? 'animate-pulse' : ''}`}
                      style={{ 
                        height: `${Math.max(3, Math.min(15, 4 + Math.sin(i * 0.9) * 10))}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.8s'
                      }}
                    ></div>
                  ))}
                </div>
                
                <div className="text-xs mt-1 opacity-80">
                  {audioDuration > 0 ? formatDuration(audioDuration) : "Voice message"}
                </div>
              </div>
            </div>
          </div>
        ) : isGifMessage && gifUrl ? (
          <div className={`rounded-2xl overflow-hidden ${
            isSender 
              ? 'chat-bubble-user shadow-sm' 
              : 'chat-bubble-other shadow-sm'
          } max-w-[240px] p-0`}>
            <img 
              src={gifUrl} 
              alt="GIF" 
              className="w-full h-auto max-w-full rounded-lg"
              loading="lazy"
              onError={(e) => {
                console.error("Failed to load GIF:", gifUrl);
                const target = e.target as HTMLImageElement;
                target.src = "https://via.placeholder.com/240x135?text=GIF+Error";
              }}
            />
          </div>
        ) : (
          <>
            <div 
              className={`rounded-2xl p-3 ${
                isSender 
                  ? 'chat-bubble-user shadow-sm shadow-violet-200' 
                  : 'chat-bubble-other'
              } transition-all`}
            >
              {message.content}
            </div>
            <div className={`mt-1 ${isSender ? 'self-end' : 'self-start'}`}>
              <MessageInsights message={message.content} />
            </div>
          </>
        )}
        
        <MessageReactions 
          reactions={message.reactions || []} 
          messageId={message.id} 
          onAddReaction={onAddReaction}
          user={user}
        />
      </div>
    </div>
  );
};

export default MessageBubble;
