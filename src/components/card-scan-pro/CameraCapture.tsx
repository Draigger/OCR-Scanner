'use client';

import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Camera, Video, VideoOff, X, RotateCcw, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CameraCaptureProps {
  onImageCapture: (base64Image: string | null) => void;
  currentImagePreview: string | null;
}

export function CameraCapture({ onImageCapture, currentImagePreview }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(currentImagePreview);
  const [isLoading, setIsLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Clean up function
  const cleanupCamera = useCallback(() => {
    console.log('Cleaning up camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    setIsCameraActive(false);
    setVideoReady(false);
    setCameraError(null);
    setIsLoading(false);
  }, []);

  // Start camera function
  const startCamera = useCallback(async () => {
    console.log('Starting camera...');
    setIsLoading(true);
    setCameraError(null);
    setVideoReady(false);
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera access is not supported in this browser.";
      setCameraError(errorMsg);
      setIsLoading(false);
      toast({
        title: "Camera Not Supported",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      // Clear any existing captured image
      setCapturedImage(null);
      onImageCapture(null);

      // Request camera access with fallback constraints
      let mediaStream: MediaStream;
      
      try {
        // Try with ideal constraints first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'environment'
          },
          audio: false
        });
      } catch (err) {
        console.log('Ideal constraints failed, trying basic constraints...');
        // Fallback to basic constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      console.log('Camera access granted, setting up video...');
      
      // Store stream reference
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      
      // Set up video element
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Clear any existing source
        video.srcObject = null;
        
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set up video with stream
        video.srcObject = mediaStream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        
        // Create a promise to handle video loading
        const videoLoadPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 10000); // 10 second timeout
          
          const handleLoadedData = () => {
            console.log('Video data loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              clearTimeout(timeout);
              video.removeEventListener('loadeddata', handleLoadedData);
              video.removeEventListener('error', handleError);
              resolve();
            }
          };
          
          const handleError = (e: Event) => {
            console.error('Video loading error:', e);
            clearTimeout(timeout);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
            reject(new Error('Video loading failed'));
          };
          
          video.addEventListener('loadeddata', handleLoadedData);
          video.addEventListener('error', handleError);
        });
        
        try {
          // Wait for video to load
          await videoLoadPromise;
          
          // Try to play the video
          await video.play();
          
          console.log('Video playing successfully');
          setVideoReady(true);
          setIsLoading(false);
          
        } catch (playError) {
          console.error('Video play error:', playError);
          throw new Error('Failed to start video playback');
        }
      }
      
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Could not access camera. ";
      
      if (err instanceof Error) {
        switch (err.name) {
          case "NotFoundError":
          case "DevicesNotFoundError":
            errorMessage += "No camera device found.";
            break;
          case "NotAllowedError":
          case "PermissionDeniedError":
            errorMessage += "Camera permission denied.";
            break;
          case "NotReadableError":
            errorMessage += "Camera is already in use.";
            break;
          case "OverconstrainedError":
            errorMessage += "Camera constraints not supported.";
            break;
          default:
            errorMessage += err.message;
        }
      }
      
      setCameraError(errorMessage);
      setIsLoading(false);
      cleanupCamera();
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [onImageCapture, toast, cleanupCamera]);

  // Capture image function
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !videoReady) {
      toast({
        title: "Capture Error",
        description: "Camera not ready. Please wait for the video feed to load.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Capture Error",
        description: "Video stream not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.95);
      
      console.log('Image captured successfully');
      setCapturedImage(base64Image);
      onImageCapture(base64Image);
      cleanupCamera();
      
      toast({
        title: "Image Captured",
        description: "ID card image captured successfully!",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    }
  }, [videoReady, onImageCapture, cleanupCamera, toast]);

  // Retake image function
  const retakeImage = useCallback(() => {
    setCapturedImage(null);
    onImageCapture(null);
    startCamera();
  }, [onImageCapture, startCamera]);

  // Clear image function
  const clearImage = useCallback(() => {
    setCapturedImage(null);
    onImageCapture(null);
    if (isCameraActive) {
      cleanupCamera();
    }
  }, [isCameraActive, onImageCapture, cleanupCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, [cleanupCamera]);

  // Sync with external image changes
  useEffect(() => {
    if (currentImagePreview === null && capturedImage !== null) {
      setCapturedImage(null);
    } else if (currentImagePreview !== null && currentImagePreview !== capturedImage) {
      setCapturedImage(currentImagePreview);
      if (isCameraActive) {
        cleanupCamera();
      }
    }
  }, [currentImagePreview, capturedImage, isCameraActive, cleanupCamera]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {!isCameraActive && !capturedImage && !isLoading && (
          <Button 
            onClick={startCamera} 
            variant="outline" 
            className="flex-1 h-12 hover-lift border-primary/20 hover:border-primary hover:bg-primary/5"
            disabled={isLoading}
          >
            <Video className="mr-2 h-5 w-5" /> 
            Start Camera
          </Button>
        )}
        
        {isLoading && (
          <Button 
            variant="outline" 
            className="flex-1 h-12"
            disabled
          >
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
            Starting Camera...
          </Button>
        )}
        
        {isCameraActive && !isLoading && (
          <>
            <Button 
              onClick={captureImage} 
              disabled={!videoReady}
              className={`flex-1 h-12 transition-all duration-300 ${
                videoReady 
                  ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Zap className="mr-2 h-5 w-5" /> 
              {videoReady ? 'Capture' : 'Loading...'}
            </Button>
            <Button 
              onClick={cleanupCamera} 
              variant="outline" 
              className="h-12 hover-lift border-destructive/20 hover:border-destructive hover:bg-destructive/5"
            >
              <VideoOff className="mr-2 h-5 w-5" /> 
              Stop
            </Button>
          </>
        )}
        
        {capturedImage && (
          <>
            <Button 
              onClick={retakeImage} 
              variant="outline" 
              className="flex-1 h-12 hover-lift border-primary/20 hover:border-primary hover:bg-primary/5"
            >
              <RotateCcw className="mr-2 h-5 w-5" /> 
              Retake
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearImage} 
              className="h-12 w-12 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Clear image"
            >
              <X className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {cameraError && (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Camera Error</AlertTitle>
          <AlertDescription>
            {cameraError}
            <div className="mt-3 text-sm">
              <strong>Troubleshooting tips:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Make sure you're using HTTPS (camera requires secure connection)</li>
                <li>Check if another app is using your camera</li>
                <li>Try refreshing the page and allowing camera permissions</li>
                <li>Ensure your browser supports camera access</li>
                <li>Try using a different browser (Chrome, Firefox, Safari, Edge)</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Feed */}
      {isCameraActive && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video rounded-xl border-2 border-primary/20 bg-black shadow-lg"
            style={{ 
              display: 'block',
              objectFit: 'cover'
            }}
            aria-label="Camera feed"
          />
          
          {/* Loading overlay */}
          {(isLoading || !videoReady) && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="text-white text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-sm">
                  {isLoading ? 'Starting camera...' : 'Loading camera feed...'}
                </p>
              </div>
            </div>
          )}
          
          {/* Capture guide overlay */}
          {videoReady && !isLoading && (
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
              <div className="absolute -top-6 left-0 text-white text-sm bg-black/50 px-2 py-1 rounded">
                Position ID card within this frame
              </div>
            </div>
          )}
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Image Display */}
      {capturedImage ? (
        <div className="relative group">
          <div className="aspect-video relative overflow-hidden rounded-xl border-2 border-primary/20 bg-white shadow-lg">
            <Image 
              src={capturedImage} 
              alt="Captured ID card" 
              fill
              className="object-contain"
              data-ai-hint="ID card document"
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
        </div>
      ) : !isCameraActive && !isLoading && (
         <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/20 text-muted-foreground">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Camera className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Camera feed will appear here</p>
                <p className="text-sm">Click "Start Camera" to begin capturing</p>
                <p className="text-xs text-muted-foreground/70">
                  Make sure to allow camera permissions when prompted
                </p>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}