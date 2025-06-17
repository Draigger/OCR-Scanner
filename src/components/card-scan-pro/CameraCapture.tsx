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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const requestCameraPermissionAndStart = useCallback(async () => {
    setIsLoading(true);
    setIsStartingCamera(true);
    setCameraError(null);
    setVideoReady(false);
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.";
      setCameraError(errorMsg);
      setHasCameraPermission(false);
      setIsLoading(false);
      setIsStartingCamera(false);
      toast({
        title: "Camera Not Supported",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Clear any existing captured image
    setCapturedImage(null);
    onImageCapture(null);

    try {
      // Start with basic constraints for better compatibility
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          facingMode: 'environment' // Prefer back camera
        },
        audio: false
      };

      console.log('Requesting camera access with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera access granted, stream tracks:', mediaStream.getTracks().length);
      
      // Check if stream has video tracks
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks found in stream');
      }
      
      console.log('Video track settings:', videoTracks[0].getSettings());
      
      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraActive(true);
      setCameraError(null);
      
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Could not access camera. ";
      
      if (err instanceof Error) {
        switch (err.name) {
          case "NotFoundError":
          case "DevicesNotFoundError":
            errorMessage += "No camera device found. Please ensure a camera is connected.";
            break;
          case "NotAllowedError":
          case "PermissionDeniedError":
            errorMessage += "Camera permission denied. Please allow camera access and try again.";
            break;
          case "NotReadableError":
            errorMessage += "Camera is already in use by another application.";
            break;
          case "OverconstrainedError":
            errorMessage += "Camera constraints not supported. Trying with basic settings...";
            // Try again with very basic constraints
            try {
              const basicStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
              });
              setStream(basicStream);
              setHasCameraPermission(true);
              setIsCameraActive(true);
              setCameraError(null);
              setIsLoading(false);
              setIsStartingCamera(false);
              return;
            } catch (basicErr) {
              errorMessage += " Basic camera access also failed.";
            }
            break;
          case "SecurityError":
            errorMessage += "Camera access blocked due to security restrictions.";
            break;
          default:
            errorMessage += `Error: ${err.message}`;
        }
      }
      
      setCameraError(errorMessage);
      setHasCameraPermission(false);
      setIsCameraActive(false);
      setStream(null);
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStartingCamera(false);
    }
  }, [onImageCapture, toast]);

  // Handle video element setup
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      const video = videoRef.current;
      console.log('Setting up video element...');
      
      // Set the stream
      video.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        setVideoReady(true);
      };
      
      const handleCanPlay = () => {
        console.log('Video can play');
        // Ensure video is playing
        video.play().catch(err => {
          console.error('Error playing video:', err);
        });
      };
      
      const handlePlaying = () => {
        console.log('Video is playing');
        setVideoReady(true);
      };
      
      const handleError = (e: Event) => {
        console.error('Video error:', e);
        setCameraError('Failed to display camera feed');
        setVideoReady(false);
      };
      
      const handleLoadStart = () => {
        console.log('Video load started');
      };
      
      // Add all event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      
      // Force play the video
      video.play().catch(err => {
        console.error('Initial play failed:', err);
      });
      
      return () => {
        // Cleanup function: properly clean up video source and event listeners
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        
        // Properly clean up video source to prevent play() interruption
        if (video.srcObject) {
          video.srcObject = null;
        }
      };
    }
  }, [isCameraActive, stream]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind, track.label);
      });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setVideoReady(false);
    setCameraError(null);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream || !isCameraActive || !videoReady) {
      toast({
        title: "Capture Error",
        description: "Camera not ready. Please wait for the video feed to load.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Double-check video is ready
    if (video.readyState < 2) {
      toast({
        title: "Capture Error",
        description: "Camera is still loading. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Capture Error",
        description: "Video stream not ready. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 with high quality
      const base64Image = canvas.toDataURL('image/jpeg', 0.95);
      
      console.log('Image captured successfully, size:', base64Image.length);
      setCapturedImage(base64Image);
      onImageCapture(base64Image);
      stopCamera();
      
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
  }, [isCameraActive, stream, videoReady, onImageCapture, stopCamera, toast]);

  const retakeImage = () => {
    setCapturedImage(null);
    onImageCapture(null);
    requestCameraPermissionAndStart();
  };

  const clearImage = () => {
    setCapturedImage(null);
    onImageCapture(null);
    if (isCameraActive) {
      stopCamera();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Sync with external image changes - prevent stopping camera during initialization
  useEffect(() => {
    if (currentImagePreview === null && capturedImage !== null) {
      setCapturedImage(null);
      if (isCameraActive && !isStartingCamera) stopCamera();
    } else if (currentImagePreview !== null && currentImagePreview !== capturedImage) {
      setCapturedImage(currentImagePreview);
      if (isCameraActive && !isStartingCamera) stopCamera(); 
    }
  }, [currentImagePreview, capturedImage, isCameraActive, isStartingCamera, stopCamera]); 

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {!isCameraActive && !capturedImage && !isLoading && (
          <Button 
            onClick={requestCameraPermissionAndStart} 
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
              onClick={stopCamera} 
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
              display: isCameraActive ? 'block' : 'none',
              objectFit: 'cover'
            }}
            aria-label="Camera feed"
          />
          
          {/* Loading overlay */}
          {!videoReady && isCameraActive && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="text-white text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-sm">Loading camera feed...</p>
              </div>
            </div>
          )}
          
          {/* Capture guide overlay */}
          {videoReady && isCameraActive && (
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