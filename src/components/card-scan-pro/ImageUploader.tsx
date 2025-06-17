'use client';

import type React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { UploadCloud, X, FileImage } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64Image: string | null) => void;
  currentImagePreview: string | null;
}

export function ImageUploader({ onImageSelect, currentImagePreview }: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImagePreview);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const clearImage = () => {
    setFileName(null);
    setImagePreview(null);
    onImageSelect(null);
    const fileInput = document.getElementById('id-card-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  if (currentImagePreview !== imagePreview && currentImagePreview === null) {
    setImagePreview(null);
    setFileName(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="id-card-upload" className="text-base font-medium flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Upload ID Card Image
        </Label>
        
        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            isDragOver 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Input 
            id="id-card-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop your ID card here</p>
              <p className="text-sm text-muted-foreground">or click to browse files</p>
            </div>
            <p className="text-xs text-muted-foreground">Supports JPG, PNG, GIF up to 10MB</p>
          </div>
          
          {imagePreview && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearImage} 
              className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white shadow-sm"
              aria-label="Clear image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {fileName && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <FileImage className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>
        )}
      </div>
      
      {imagePreview ? (
        <div className="relative group">
          <div className="aspect-video relative overflow-hidden rounded-xl border bg-white shadow-lg">
            <Image 
              src={imagePreview} 
              alt="ID card preview" 
              fill
              className="object-contain"
              data-ai-hint="ID card document"
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
        </div>
      ) : (
        <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/20 text-muted-foreground">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-sm">Image preview will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}