import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, Trash2, Volume2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VoiceMessageRecorderProps {
  onVoiceMessageRecorded: (blob: Blob) => void;
  onCancel?: () => void;
}

const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({ 
  onVoiceMessageRecorded,
  onCancel 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      visualize();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVisualization = () => {
      if (!analyserRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      const sampleSize = Math.floor(bufferLength / 8);
      const samples = [];
      
      for (let i = 0; i < 8; i++) {
        let sum = 0;
        for (let j = 0; j < sampleSize; j++) {
          sum += dataArray[i * sampleSize + j];
        }
        samples.push(sum / sampleSize);
      }
      
      setAudioVisualization(samples);
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  const playPausePreview = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => 
        console.error("Error playing audio preview:", err)
      );
    }
    
    setIsPlaying(!isPlaying);
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onVoiceMessageRecorded(audioBlob);
      setAudioBlob(null);
      setAudioUrl(null);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-2 w-full">
      {!isRecording && !audioBlob ? (
        <div className="flex w-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="h-10 w-10 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Mic size={20} />
          </Button>
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">Click to record audio</span>
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center">
          {isRecording ? (
            <div className="flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg w-full">
              <div className="flex items-center gap-1 h-6">
                {audioVisualization.map((value, index) => (
                  <div 
                    key={index}
                    className="w-1 bg-rose-500 rounded-full"
                    style={{ 
                      height: `${Math.max(4, (value / 255) * 18)}px`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
              <span className="text-xs font-medium text-rose-600 ml-2">{formatTime(recordingTime)}</span>
              <div className="flex-1"></div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={stopRecording}
                className="h-8 w-8 rounded-full bg-rose-100 text-rose-500 hover:bg-rose-200"
              >
                <Square size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-violet-50 px-3 py-2 rounded-lg w-full">
              {audioUrl && (
                <>
                  <audio ref={audioRef} src={audioUrl} className="hidden"></audio>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={playPausePreview}
                    className="h-8 w-8 rounded-full bg-violet-100 text-violet-500 hover:bg-violet-200"
                  >
                    {isPlaying ? <Square size={14} /> : <Volume2 size={14} />}
                  </Button>
                </>
              )}
              <span className="text-xs text-violet-600 font-medium">Voice message ready</span>
              <div className="flex-1"></div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <Trash2 size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={sendVoiceMessage}
                className="h-8 w-8 rounded-full bg-violet-500 hover:bg-violet-600 text-white"
              >
                <Send size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
