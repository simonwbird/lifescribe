import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Square, Play, Pause, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TeenVideoCaptureProps {
  onVideoCapture: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds, default 30
  minDuration?: number; // in seconds, default 10
}

export default function TeenVideoCapture({ 
  onVideoCapture, 
  onCancel,
  maxDuration = 30,
  minDuration = 10 
}: TeenVideoCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stopStream();
        setIsPreviewing(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (duration < minDuration) {
        toast({
          title: "Video too short",
          description: `Please record at least ${minDuration} seconds`,
          variant: "destructive"
        });
        setDuration(0);
        chunksRef.current = [];
        return;
      }
    }
  };

  const playPreview = () => {
    if (videoRef.current && recordedBlob) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const url = URL.createObjectURL(recordedBlob);
        videoRef.current.src = url;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const retakeVideo = () => {
    setRecordedBlob(null);
    setIsPreviewing(false);
    setDuration(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const handleSave = () => {
    if (recordedBlob) {
      onVideoCapture(recordedBlob, duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '60vh' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted={isRecording}
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* Timer overlay */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
        )}
        
        {isPreviewing && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full w-16 h-16"
              onClick={playPreview}
            >
              <Play className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!isRecording && !isPreviewing && (
          <>
            <Button
              size="lg"
              onClick={startRecording}
              className="flex-1 max-w-xs"
            >
              <Video className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </>
        )}
        
        {isRecording && (
          <Button
            size="lg"
            variant="destructive"
            onClick={stopRecording}
            className="flex-1 max-w-xs"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop ({formatTime(maxDuration - duration)} left)
          </Button>
        )}
        
        {isPreviewing && (
          <>
            <Button
              variant="outline"
              onClick={retakeVideo}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              variant="outline"
              onClick={playPreview}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              Use This Video
            </Button>
          </>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Record a video between {minDuration}-{maxDuration} seconds
      </p>
    </Card>
  );
}
