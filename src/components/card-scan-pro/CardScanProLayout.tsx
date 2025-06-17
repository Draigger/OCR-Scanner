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
import { FileWarning, Sparkles, Shield, Zap } from 'lucide-react';

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
    setClearPreviewSignal(prev => prev + 1);
    toast({ title: 'Form Reset', description: 'All fields and image cleared.', variant: 'default' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Hero Header */}
        <header className="text-center space-y-6 py-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CardScan Pro
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Advanced AI-powered ID card scanning with intelligent data extraction and validation
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/20 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Lightning Fast OCR</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/20 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">AI Validation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Smart Export</span>
            </div>
          </div>
        </header>
        
        {showOcrApiKeyWarning === true && (
          <Alert variant="destructive" className="glass-effect border-destructive/20">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>OCR API Key Not Configured</AlertTitle>
            <AlertDescription>
              The application is using a default, rate-limited OCR.space API key. 
              For full functionality and to avoid processing errors, please set the <code className="font-mono bg-muted px-1 rounded-sm">OCR_SPACE_API_KEY</code> environment variable with your own key.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={handleReset} variant="outline" className="hover-lift">
            Reset All
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 fade-in">
            <ImageInputSection 
              onProcessImage={handleProcessImage} 
              isProcessing={isProcessing}
              clearPreviewSignal={clearPreviewSignal}
            />
          </div>
          <div className="space-y-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <DataDisplayForm
              initialData={extractedData}
              onValidate={handleValidateData}
              isValidating={isValidating}
              validationResult={validationResult}
              rawOcrText={rawOcrText}
            />
            {extractedData && (
              <div className="fade-in" style={{ animationDelay: '0.2s' }}>
                <ExportControls data={extractedData} />
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-12 bg-gradient-to-r from-transparent via-border to-transparent" />
        
        {/* Enhanced Footer */}
        <footer className="text-center py-8 space-y-4">
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Powered by advanced AI technology</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CardScan Pro. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}