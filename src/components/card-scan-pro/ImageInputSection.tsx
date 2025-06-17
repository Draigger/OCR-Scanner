'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUploader } from './ImageUploader';
import { CameraCapture } from './CameraCapture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Loader2, Upload, Camera } from 'lucide-react';

interface ImageInputSectionProps {
  onProcessImage: (base64Image: string) => void;
  isProcessing: boolean;
  clearPreviewSignal: number;
}

export function ImageInputSection({ onProcessImage, isProcessing, clearPreviewSignal }: ImageInputSectionProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');

  const handleImageSelected = (base64Image: string | null) => {
    setSelectedImage(base64Image);
  };
  
  useEffect(() => {
    if (clearPreviewSignal > 0) { 
      setSelectedImage(null);
    }
  }, [clearPreviewSignal]);

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-2xl font-bold">
          <div className="p-2 bg-primary/10 rounded-lg mr-3">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          ID Card Image
        </CardTitle>
        <p className="text-muted-foreground">Upload an image or use your camera to capture an ID card</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'camera')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Upload className="h-4 w-4" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Camera className="h-4 w-4" />
              Use Camera
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-6">
            <ImageUploader onImageSelect={handleImageSelected} currentImagePreview={activeTab === 'upload' ? selectedImage : null} />
          </TabsContent>
          <TabsContent value="camera" className="mt-6">
            <CameraCapture onImageCapture={handleImageSelected} currentImagePreview={activeTab === 'camera' ? selectedImage : null} />
          </TabsContent>
        </Tabs>
        
        {selectedImage && (
          <Button 
            onClick={() => onProcessImage(selectedImage)} 
            disabled={isProcessing || !selectedImage}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Process image for OCR"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Processing Image...
              </>
            ) : (
              <>
                <ImageIcon className="mr-3 h-5 w-5" />
                Process Image
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}