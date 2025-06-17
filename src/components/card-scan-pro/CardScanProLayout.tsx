'use client';

import { useState, useEffect } from 'react';
import type { ExtractedIdData } from '@/types';
import { processImage, validateDataWithAI } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { ImageInputSection } from './ImageInputSection';
import { DataDisplayForm } from './DataDisplayForm';
import { ExportControls } from './ExportControls';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileWarning } from 'lucide-react';

export function CardScanProLayout() {
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ type: 'success' | 'error' | 'info' | null, message: string | null } | null>(null);
  const [showOcrApiKeyWarning, setShowOcrApiKeyWarning] = useState<boolean | null>(null);
  const [clearPreviewSignal, setClearPreviewSignal] = useState(0);


  const { toast } = useToast();

  const handleProcessImage = async (image: string) => {
    setBase64Image(image);
    setIsProcessing(true);
    setExtractedData(null);
    setRawOcrText(null);
    setValidationResult(null);
    setShowOcrApiKeyWarning(null);

    const result = await processImage(image);
    setIsProcessing(false);
    setShowOcrApiKeyWarning(result.usesDefaultKey);


    if (result.error) {
      toast({ title: 'Processing Error', description: result.error, variant: 'destructive' });
    } else if (result.data) {
      setExtractedData(result.data);
      setRawOcrText(result.rawOcrText || null);
      toast({ title: 'Processing Successful', description: 'Data extracted from image.', variant: 'default' });
    }
  };

  const handleValidateData = async (data: ExtractedIdData) => {
    setIsValidating(true);
    setValidationResult(null);
    const result = await validateDataWithAI(data);
    setIsValidating(false);

    if (result.error) {
      setValidationResult({ type: 'error', message: result.error });
      toast({ title: 'Validation Error', description: result.error, variant: 'destructive' });
    } else if (result.validationResult) {
      setValidationResult({ type: 'info', message: result.validationResult });
      // Determine if it's overall a "success" based on keywords, or just keep it 'info'
      // This is a simple heuristic, real logic might be more complex
      if (result.validationResult.toLowerCase().includes('looks good') || result.validationResult.toLowerCase().includes('consistent')) {
         setValidationResult({ type: 'success', message: result.validationResult });
      }
      toast({ title: 'Validation Complete', description: 'AI validation summary received.', variant: 'default' });
    }
  };
  
  const handleReset = () => {
    setBase64Image(null);
    setExtractedData(null);
    setRawOcrText(null);
    setValidationResult(null);
    setIsProcessing(false);
    setIsValidating(false);
    setShowOcrApiKeyWarning(null);
    setClearPreviewSignal(prev => prev + 1); // Signal to clear previews in children
    toast({ title: 'Form Reset', description: 'All fields and image cleared.', variant: 'default' });
  };


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">CardScan Pro</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Upload or capture an ID card image to automatically extract information.
        </p>
      </header>
      
      {showOcrApiKeyWarning === true && (
        <Alert variant="destructive" className="mt-4">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>OCR API Key Not Configured</AlertTitle>
          <AlertDescription>
            The application is using a default, rate-limited OCR.space API key. 
            For full functionality and to avoid processing errors, please set the <code className="font-mono bg-muted px-1 rounded-sm">OCR_SPACE_API_KEY</code> environment variable with your own key.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleReset} variant="outline">Reset All</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <ImageInputSection 
            onProcessImage={handleProcessImage} 
            isProcessing={isProcessing}
            clearPreviewSignal={clearPreviewSignal}
          />
        </div>
        <div className="space-y-6">
          <DataDisplayForm
            initialData={extractedData}
            onValidate={handleValidateData}
            isValidating={isValidating}
            validationResult={validationResult}
            rawOcrText={rawOcrText}
          />
          {extractedData && <ExportControls data={extractedData} />}
        </div>
      </div>
      <Separator className="my-12" />
      <footer className="text-center text-sm text-muted-foreground py-4">
        &copy; {new Date().getFullYear()} CardScan Pro. All rights reserved.
      </footer>
    </div>
  );
}
