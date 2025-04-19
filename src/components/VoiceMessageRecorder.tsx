import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, Trash2, Volume2, Pause, Play, LoaderCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface VoiceMessageRecorderProps {
  onVoiceMessageRecorded: (blob: Blob, audioUrl: string) => void;
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
  const [audioVisualization, setAudioVisualization] = useState<number[]>(new Array(12).fill(4));
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [recordButtonPulsing, setRecordButtonPulsing] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  
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
      if (requestingMic) return;
      
      setRequestingMic(true);
      setRecordButtonPulsing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setRecordButtonPulsing(false);
      setRequestingMic(false);
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setIsProcessing(true);
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
          animationFrameRef.current = null;
        }
        
        setTimeout(() => {
          setIsProcessing(false);
        }, 500);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      visualize();
      
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
          toast({
            description: "Maximum recording time reached (60 seconds)",
            duration: 3000,
          });
        }
      }, 60000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setRecordButtonPulsing(false);
      setRequestingMic(false);
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
      
      const sampleSize = Math.floor(bufferLength / 12);
      const samples: number[] = [];
      
      for (let i = 0; i < 12; i++) {
        let sum = 0;
        for (let j = 0; j < sampleSize; j++) {
          sum += dataArray[i * sampleSize + j];
        }
        const value = Math.max(3, Math.min(20, (sum / sampleSize / 255) * 20));
        samples.push(value);
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
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Error playing audio preview:", err);
        toast({
          title: "Playback Error",
          description: "Could not play the audio preview.",
          variant: "destructive"
        });
      });
      setIsPlaying(true);
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob && audioUrl) {
      onVoiceMessageRecorded(audioBlob, audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      setIsPlaying(false);
      setAudioProgress(0);
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
    
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };
    
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
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
            className={cn(
              "h-10 w-10 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50",
              recordButtonPulsing && "animate-pulse"
            )}
            disabled={recordButtonPulsing || requestingMic}
          >
            {recordButtonPulsing ? <LoaderCircle size={20} className="animate-spin" /> : <Mic size={20} />}
          </Button>
          <div className="flex-1 flex items-center">
            <span className="text-sm text-muted-foreground ml-2">
              {recordButtonPulsing ? "Accessing microphone..." : "Click to record audio (max 60s)"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center">
          {isRecording ? (
            <div className="flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg w-full">
              <div className="flex items-center gap-[2px] h-6">
                {audioVisualization.map((value, index) => (
                  <div 
                    key={index}
                    className="w-1 bg-rose-500 rounded-full animate-pulse"
                    style={{ 
                      height: `${value}px`,
                      animationDelay: `${index * 0.1}s`,
                      animationDuration: '0.6s'
                    }}
                  ></div>
                ))}
              </div>
              <span className="text-xs font-medium text-rose-600 ml-2">
                {formatTime(recordingTime)}
              </span>
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
            <div className="flex flex-col gap-2 bg-violet-50 px-3 py-2 rounded-lg w-full">
              {isProcessing ? (
                <div className="flex items-center justify-center py-2">
                  <LoaderCircle size={20} className="text-violet-500 animate-spin" />
                  <span className="ml-2 text-xs text-violet-600">Processing audio...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
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
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </Button>
                      </>
                    )}
                    <span className="text-xs text-violet-600 font-medium ml-2">Voice message ready</span>
                    <div className="flex-1"></div>
                    <span className="text-xs text-violet-500 opacity-80">{formatTime(recordingTime)}</span>
                  </div>
                  
                  <Progress 
                    value={audioProgress} 
                    className="h-1 bg-violet-200" 
                    indicatorClassName="bg-violet-500" 
                  />
                  
                  <div className="flex justify-end gap-2 mt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelRecording}
                      className="h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full px-3"
                    >
                      <Trash2 size={14} className="mr-1" />
                      <span className="text-xs">Discard</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={sendVoiceMessage}
                      className="h-8 bg-violet-500 hover:bg-violet-600 text-white rounded-full px-3"
                    >
                      <Send size={14} className="mr-1" />
                      <span className="text-xs">Send</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
