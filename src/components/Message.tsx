import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { 
  formatTimestamp, 
  Message as MessageType, 
  isOwnMessage,
  User
} from '@/utils/messageUtils';
import MessageReactions from './MessageReactions';
import { Volume2, Play, Pause } from 'lucide-react';

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
  animate?: boolean;
  onAddReaction: (messageId: string, reaction: string) => void;
  currentUser: User;
}

const Message: React.FC<MessageProps> = ({ 
  message, 
  isOwn, 
  animate = true,
  onAddReaction,
  currentUser
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioDuration, setAudioDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  
  useEffect(() => {
    if (messageRef.current && animate) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [animate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleDurationChange = () => {
      setAudioDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error("Error playing audio:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const formatAudioTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div 
      ref={messageRef}
      className={cn(
        'flex gap-3 px-4 py-2 animate-slide-in',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="flex-shrink-0 mt-1">
        <Avatar className="h-8 w-8 shadow-sm">
          <img src={message.sender.photoURL} alt={message.sender.name} />
        </Avatar>
      </div>
      
      <div className={cn('max-w-[80%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">{message.sender.name}</span>
        </div>
        
        <div 
          className={cn(
            'px-4 py-2 rounded-2xl text-sm shadow-sm animate-bubble-in',
            isOwn 
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' 
              : 'bg-white border border-gray-100'
          )}
        >
          {message.isVoiceMessage && message.voiceUrl ? (
            <div className="flex flex-col w-64">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-rose-500" />
                <span className="text-xs font-medium">Voice Message</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={togglePlayPause}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-full transition-colors",
                    isOwn 
                      ? "bg-white/20 hover:bg-white/30 text-white" 
                      : "bg-violet-100 hover:bg-violet-200 text-violet-600"
                  )}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                
                <div className="flex-1">
                  <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-full rounded-full",
                        isOwn ? "bg-white/70" : "bg-violet-500"
                      )}
                      style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs opacity-70">{formatAudioTime(currentTime)}</span>
                    <span className="text-xs opacity-70">{formatAudioTime(audioDuration)}</span>
                  </div>
                </div>
              </div>
              
              <audio 
                ref={audioRef}
                src={message.voiceUrl} 
                className="hidden"
              ></audio>
            </div>
          ) : (
            message.content
          )}
        </div>
        
        <MessageReactions 
          messageId={message.id}
          reactions={message.reactions || []}
          onAddReaction={onAddReaction}
          user={currentUser}
        />
        
        <span className="text-xs text-muted-foreground mt-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default Message;
