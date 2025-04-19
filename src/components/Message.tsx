
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  formatTimestamp, 
  Message as MessageType, 
  isOwnMessage,
  User
} from '@/utils/messageUtils';
import MessageReactions from './MessageReactions';
import MessageEmbed from './MessageEmbed';
import { Volume2, Play, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const isGifMessage = message.content?.startsWith('[gif]') && message.content?.endsWith('[/gif]');
  const isStickerMessage = message.content?.startsWith('[sticker]') && message.content?.endsWith('[/sticker]');

  useEffect(() => {
    if (messageRef.current && animate) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [animate]);

  useEffect(() => {
    if (message.isVoiceMessage && message.voiceUrl) {
      console.log("Voice message URL in Message component:", message.voiceUrl);
    }
  }, [message.isVoiceMessage, message.voiceUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleDurationChange = () => {
      setAudioDuration(audio.duration);
      setAudioInitialized(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioProgress(0);
    };

    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleDurationChange);
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
      setIsPlaying(false);
    } else {
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);
    }
  };

  const formatAudioTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const findUrls = (text: string): string[] => {
    if (!text) return [];
    if (isGifMessage || isStickerMessage) return [];
    
    // This regex matches URLs starting with http://, https://, or www.
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const matches = text.match(urlRegex);
    
    // Process matches to ensure they have proper protocol
    if (matches) {
      return matches.map(url => {
        if (url.startsWith('www.')) {
          return `https://${url}`;
        }
        return url;
      });
    }
    
    return [];
  };

  // Extract URLs from message content
  const messageUrls = message.content ? findUrls(message.content) : [];
  console.log("Found URLs in message:", messageUrls);

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
          <AvatarImage src={message.sender.photoURL} alt={message.sender.name} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            {message.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className={cn('max-w-[80%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">{message.sender.name}</span>
        </div>
        
        {isGifMessage || isStickerMessage ? (
          <div className="inline-block">
            <MessageEmbed url={message.content} />
          </div>
        ) : message.isVoiceMessage ? (
          <div className="flex flex-col min-w-[200px] w-64 px-4 py-2 rounded-2xl text-sm shadow-sm animate-bubble-in bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={16} className={isOwn ? "text-white/80" : "text-rose-500"} />
              <span className={`text-xs font-medium ${isOwn ? "text-white/80" : "text-violet-600"}`}>
                {`Voice Message ${audioDuration > 0 ? `(${formatAudioTime(audioDuration)})` : ""}`}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlayPause}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-full transition-colors",
                  isOwn 
                    ? "bg-white/20 hover:bg-white/30 text-white" 
                    : "bg-violet-100 hover:bg-violet-200 text-violet-600"
                )}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              
              <div className="flex-1 flex flex-col gap-1">
                {!isPlaying ? (
                  <div className="flex items-center gap-0.5 h-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-1 rounded-full transition-all duration-150",
                          isOwn ? "bg-white/60" : "bg-violet-400/60"
                        )}
                        style={{ 
                          height: `${Math.max(2, Math.min(16, 4 + Math.sin(i * 0.8) * 10))}px`
                        }}
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 h-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-1 rounded-full animate-pulse",
                          isOwn ? "bg-white/80" : "bg-violet-400/80"
                        )}
                        style={{ 
                          height: `${Math.max(3, Math.min(16, 4 + Math.sin((i + currentTime * 2) * 0.8) * 10))}px`,
                          animationDuration: '0.8s',
                          animationDelay: `${i * 0.08}s`
                        }}
                      ></div>
                    ))}
                  </div>
                )}
                
                <Progress 
                  value={audioProgress} 
                  className={cn(
                    "h-1.5", 
                    isOwn ? "bg-white/20" : "bg-violet-100"
                  )}
                />
                
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${isOwn ? "text-white/70" : "text-violet-500/70"}`}>
                    {formatAudioTime(currentTime)}
                  </span>
                  <span className={`text-xs ${isOwn ? "text-white/70" : "text-violet-500/70"}`}>
                    {formatAudioTime(audioDuration)}
                  </span>
                </div>
              </div>
            </div>
            
            <audio 
              ref={audioRef}
              src={message.voiceUrl} 
              className="hidden"
              preload="metadata"
            ></audio>
          </div>
        ) : (
          <div 
            className={cn(
              'px-4 py-2 rounded-2xl text-sm shadow-sm animate-bubble-in',
              isOwn 
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' 
                : 'bg-white border border-gray-100'
            )}
          >
            <div className="relative">
              {message.content}
              {messageUrls.length > 0 && messageUrls.map((url, index) => (
                <MessageEmbed key={`embed-${message.id}-${index}`} url={url} />
              ))}
            </div>
          </div>
        )}
        
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
