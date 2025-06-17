
'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUploader } from './ImageUploader';
import { CameraCapture } from './CameraCapture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageInputSectionProps {
  onProcessImage: (base64Image: string) => void;
  isProcessing: boolean;
  clearPreviewSignal: number; // Increment to signal clearing previews
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
      // If the image selection is cleared, and the current active tab is using this selection,
      // it should also call onImageSelected(null) to propagate the clearing action
      // However, setSelectedImage(null) will trigger re-render and currentImagePreview prop for children will update.
    }
  }, [clearPreviewSignal]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <ImageIcon className="mr-2 h-6 w-6 text-primary" />
          ID Card Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'camera')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="camera">Use Camera</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <ImageUploader onImageSelect={handleImageSelected} currentImagePreview={activeTab === 'upload' ? selectedImage : null} />
          </TabsContent>
          <TabsContent value="camera" className="mt-4">
            <CameraCapture onImageCapture={handleImageSelected} currentImagePreview={activeTab === 'camera' ? selectedImage : null} />
          </TabsContent>
        </Tabs>
        
        {selectedImage && (
          <Button 
            onClick={() => onProcessImage(selectedImage)} 
            disabled={isProcessing || !selectedImage}
            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Process image for OCR"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isProcessing ? 'Processing...' : 'Process Image'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
