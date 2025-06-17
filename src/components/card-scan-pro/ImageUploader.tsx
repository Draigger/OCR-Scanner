'use client';

import type React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64Image: string | null) => void;
  currentImagePreview: string | null;
}

export function ImageUploader({ onImageSelect, currentImagePreview }: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImagePreview);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        onImageSelect(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      setFileName(null);
      setImagePreview(null);
      onImageSelect(null);
    }
  };

  const clearImage = () => {
    setFileName(null);
    setImagePreview(null);
    onImageSelect(null);
    // Reset file input value
    const fileInput = document.getElementById('id-card-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  // Sync with prop if it changes externally
  if (currentImagePreview !== imagePreview && currentImagePreview === null) {
    setImagePreview(null);
    setFileName(null);
  }


  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="id-card-upload">Upload ID Card Image</Label>
        <div className="flex items-center space-x-2">
          <Input id="id-card-upload" type="file" accept="image/*" onChange={handleFileChange} className="flex-grow"/>
          {imagePreview && (
            <Button variant="ghost" size="icon" onClick={clearImage} aria-label="Clear image">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
      </div>
      
      {imagePreview ? (
        <div className="mt-4 p-2 border rounded-md shadow-sm bg-white aspect-video relative max-w-full overflow-hidden">
          <Image 
            src={imagePreview} 
            alt="ID card preview" 
            layout="fill"
            objectFit="contain"
            data-ai-hint="ID card document"
          />
        </div>
      ) : (
         <div className="mt-4 p-8 border-2 border-dashed border-border rounded-md shadow-sm bg-muted/50 flex flex-col items-center justify-center aspect-video text-muted-foreground" data-ai-hint="document placeholder">
            <UploadCloud className="h-12 w-12 mb-2" />
            <p>Image preview will appear here</p>
        </div>
      )}
    </div>
  );
}
