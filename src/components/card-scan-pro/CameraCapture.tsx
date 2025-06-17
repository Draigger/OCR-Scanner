'use client';

import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Camera, Video, VideoOff, X, RotateCcw, Zap } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const requestCameraPermissionAndStart = useCallback(async () => {
    if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your browser does not support camera access.",
        variant: "destructive",
      });
      setHasCameraPermission(false);
      return;
    }

    setCapturedImage(null);
    onImageCapture(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error && (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")) {
        toast({
          title: "Camera Not Found",
          description: "No camera device was found. Please ensure a camera is connected and enabled.",
          variant: "destructive",
        });
      } else if (err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
         toast({
          title: "Camera Access Denied",
          description: "Camera permission was denied. Please enable it in your browser settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions or try again.",
          variant: "destructive",
        });
      }
      setHasCameraPermission(false);
      setIsCameraActive(false);
      setStream(null);
    }
  }, [onImageCapture, toast]);

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsCameraActive(false);
  }, [stream]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && stream && isCameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({
          title: "Capture Error",
          description: "Video stream not ready or no dimensions. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/png');
        setCapturedImage(base64Image);
        onImageCapture(base64Image);
        stopCamera(); 
      }
    } else {
      toast({
        title: "Capture Error",
        description: "Camera not active or stream not available.",
        variant: "destructive",
      });
    }
  };

  const retakeImage = () => {
    requestCameraPermissionAndStart();
  };

  const clearImage = () => {
    setCapturedImage(null);
    onImageCapture(null);
    if (isCameraActive) {
      stopCamera();
    }
  };
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (currentImagePreview === null && capturedImage !== null) {
        setCapturedImage(null);
        if(isCameraActive) stopCamera();
    } else if (currentImagePreview !== null && currentImagePreview !== capturedImage) {
        setCapturedImage(currentImagePreview);
         if(isCameraActive) stopCamera(); 
    }
  }, [currentImagePreview, capturedImage, isCameraActive, stopCamera]); 

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {!isCameraActive && !capturedImage && (hasCameraPermission !== false) && (
          <Button 
            onClick={requestCameraPermissionAndStart} 
            variant="outline" 
            className="flex-1 h-12 hover-lift border-primary/20 hover:border-primary hover:bg-primary/5"
          >
            <Video className="mr-2 h-5 w-5" /> 
            Start Camera
          </Button>
        )}
        {isCameraActive && (
          <>
            <Button 
              onClick={captureImage} 
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Zap className="mr-2 h-5 w-5" /> 
              Capture
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

      {hasCameraPermission === false && (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <VideoOff className="h-5 w-5" />
          <AlertTitle className="font-semibold">Camera Access Problem</AlertTitle>
          <AlertDescription>
            Could not access the camera. Please ensure it's enabled and permissions are granted in your browser settings.
            You might need to reload the page after granting permissions.
          </AlertDescription>
        </Alert>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full aspect-video rounded-xl border-2 bg-black shadow-lg ${isCameraActive ? 'block border-primary/20' : 'hidden'}`}
        aria-label="Camera feed"
      />
      <canvas ref={canvasRef} className="hidden" />

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
      ) : !isCameraActive && hasCameraPermission !== false && (
         <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/20 text-muted-foreground">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Camera className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Camera feed will appear here</p>
                {hasCameraPermission === null && <p className="text-sm">Click "Start Camera" to begin capturing</p>}
              </div>
            </div>
        </div>
      )}
    </div>
  );
}