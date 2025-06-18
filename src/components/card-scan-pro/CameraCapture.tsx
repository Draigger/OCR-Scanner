'use client';

import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CameraCaptureProps {
  onImageCapture: (base64Image: string | null) => void;
  currentImagePreview: string | null;
}

export function CameraCapture({ onImageCapture, currentImagePreview }: CameraCaptureProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(currentImagePreview);
  const [isLoading, setIsLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Clean up camera stream
  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setVideoReady(false);
    setIsLoading(false);
    setCameraError(null);
  }, []);

  // Start camera with high quality settings
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);
    setVideoReady(false);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera access is not supported in this browser.";
      setCameraError(errorMsg);
      setIsLoading(false);
      return;
    }

    try {
      // Request high-quality back camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment' // Prefer back camera
        },
        audio: false
      });

      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 10000);
          
          const handleLoadedData = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              clearTimeout(timeout);
              video.removeEventListener('loadeddata', handleLoadedData);
              video.removeEventListener('error', handleError);
              resolve();
            }
          };
          
          const handleError = () => {
            clearTimeout(timeout);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
            reject(new Error('Video loading failed'));
          };
          
          video.addEventListener('loadeddata', handleLoadedData);
          video.addEventListener('error', handleError);
        });
        
        await videoRef.current.play();
        setVideoReady(true);
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Could not access camera. ";
      
      if (err instanceof Error) {
        switch (err.name) {
          case "NotFoundError":
            errorMessage += "No camera device found.";
            break;
          case "NotAllowedError":
            errorMessage += "Camera permission denied.";
            break;
          case "NotReadableError":
            errorMessage += "Camera is already in use.";
            break;
          default:
            errorMessage += err.message;
        }
      }
      
      setCameraError(errorMessage);
      setIsLoading(false);
      cleanupCamera();
    }
  }, [cleanupCamera]);

  // Open camera modal
  const openCamera = useCallback(() => {
    setIsCameraOpen(true);
    setShowReview(false);
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Close camera modal
  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
    setShowReview(false);
    cleanupCamera();
  }, [cleanupCamera]);

  // Capture photo
  const capturePhoto = useCallback(() => {
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
    
    try {
      // Set canvas to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to JPEG with 90% quality
      const base64Image = canvas.toDataURL('image/jpeg', 0.9);
      
      setCapturedImage(base64Image);
      setShowReview(true);
      
      // Stop camera during review to save resources
      cleanupCamera();
      
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    }
  }, [videoReady, cleanupCamera, toast]);

  // Use captured photo
  const usePhoto = useCallback(() => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      closeCamera();
      toast({
        title: "Photo Selected",
        description: "ID card image captured successfully!",
        variant: "default",
      });
    }
  }, [capturedImage, onImageCapture, closeCamera, toast]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setShowReview(false);
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Clear captured image
  const clearImage = useCallback(() => {
    setCapturedImage(null);
    onImageCapture(null);
  }, [onImageCapture]);

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
    }
  }, [currentImagePreview, capturedImage]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {!capturedImage && (
            <Button 
              onClick={openCamera} 
              variant="outline" 
              className="flex-1 h-12 hover-lift border-primary/20 hover:border-primary hover:bg-primary/5"
            >
              <Camera className="mr-2 h-5 w-5" /> 
              Use Camera
            </Button>
          )}
          
          {capturedImage && (
            <>
              <Button 
                onClick={openCamera} 
                variant="outline" 
                className="flex-1 h-12 hover-lift border-primary/20 hover:border-primary hover:bg-primary/5"
              >
                <RotateCcw className="mr-2 h-5 w-5" /> 
                Retake Photo
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
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/20 text-muted-foreground">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Camera className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Camera preview will appear here</p>
                <p className="text-sm">Click "Use Camera" to start capturing</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-white text-lg font-semibold">Capture ID Card</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeCamera}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Camera Content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {!showReview ? (
              <>
                {/* Video Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: videoReady ? 'block' : 'none' }}
                />

                {/* Loading State */}
                {(isLoading || !videoReady) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-white text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                      <p className="text-lg">
                        {isLoading ? 'Starting camera...' : 'Loading camera feed...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ID Card Frame Overlay */}
                {videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative">
                      {/* Main frame */}
                      <div 
                        className="border-2 border-white/80 rounded-lg"
                        style={{ width: '320px', height: '192px' }}
                      >
                        {/* Corner guides */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                      </div>
                      
                      {/* Instruction text */}
                      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white text-center">
                        <p className="text-sm bg-black/50 px-3 py-1 rounded-full">
                          Position ID card within the frame
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Capture Button */}
                {videoReady && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black shadow-lg"
                    >
                      <Camera className="h-8 w-8" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Review Stage */
              <div className="w-full h-full flex flex-col">
                {/* Preview Image */}
                <div className="flex-1 flex items-center justify-center p-4">
                  {capturedImage && (
                    <div className="max-w-2xl max-h-full">
                      <img
                        src={capturedImage}
                        alt="Captured ID card"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Review Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    size="lg"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Retake
                  </Button>
                  <Button
                    onClick={usePhoto}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Use Photo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  );
}