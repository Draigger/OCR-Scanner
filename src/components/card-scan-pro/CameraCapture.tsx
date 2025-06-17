
'use client';

import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Camera, Video, VideoOff, X, RotateCcw } from 'lucide-react';
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
      // Removed explicit videoRef.current.play() - relying on autoPlay attribute
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImagePreview]); 

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        {!isCameraActive && !capturedImage && (hasCameraPermission !== false) && (
          <Button onClick={requestCameraPermissionAndStart} variant="outline">
            <Video className="mr-2 h-4 w-4" /> Start Camera
          </Button>
        )}
        {isCameraActive && (
          <>
            <Button onClick={captureImage} variant="default">
              <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
            <Button onClick={stopCamera} variant="outline">
              <VideoOff className="mr-2 h-4 w-4" /> Stop Camera
            </Button>
          </>
        )}
        {capturedImage && (
          <>
            <Button onClick={retakeImage} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Retake
            </Button>
            <Button variant="ghost" size="icon" onClick={clearImage} aria-label="Clear image">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {hasCameraPermission === false && (
        <Alert variant="destructive">
          <VideoOff className="h-4 w-4" />
          <AlertTitle>Camera Access Problem</AlertTitle>
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
        className={`w-full aspect-video rounded-md border bg-black shadow-sm ${isCameraActive ? 'block' : 'hidden'}`}
        aria-label="Camera feed"
      />
      <canvas ref={canvasRef} className="hidden" />

      {capturedImage ? (
        <div className="mt-4 p-2 border rounded-md shadow-sm bg-white aspect-video relative max-w-full overflow-hidden">
          <Image 
            src={capturedImage} 
            alt="Captured ID card" 
            layout="fill"
            objectFit="contain"
            data-ai-hint="ID card document"
          />
        </div>
      ) : !isCameraActive && hasCameraPermission !== false && (
         <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md shadow-sm bg-muted/50 flex flex-col items-center justify-center aspect-video text-muted-foreground" data-ai-hint="camera placeholder">
            <Camera className="h-12 w-12 mb-2" />
            <p>Camera feed or captured image will appear here</p>
            {hasCameraPermission === null && <p className="text-sm mt-1">Click "Start Camera" to begin.</p>}
        </div>
      )}
    </div>
  );
}
