'use client';

import type { ExtractedIdData } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { User, CalendarDays, FileText, CheckCircle, AlertTriangle, Loader2, Info, Sparkles } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const idDataSchema = z.object({
  surname: z.string().min(1, 'Surname is required'),
  firstName: z.string().min(1, 'First name is required'),
  gender: z.string().min(1, 'Gender is required').regex(/^[MF]$|^Other$/, { message: "Gender must be M, F, or Other" }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be YYYY-MM-DD'),
  idNumber: z.string().min(1, 'ID number is required'),
});

interface DataDisplayFormProps {
  initialData: ExtractedIdData | null;
  onValidate: (data: ExtractedIdData) => void;
  isValidating: boolean;
  validationResult: { type: 'success' | 'error' | 'info' | null, message: string | null } | null;
  rawOcrText: string | null;
}

export function DataDisplayForm({ initialData, onValidate, isValidating, validationResult, rawOcrText }: DataDisplayFormProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExtractedIdData>({
    resolver: zodResolver(idDataSchema),
    defaultValues: initialData || { surname: '', firstName: '', gender: '', dateOfBirth: '', idNumber: '' },
  });

  useEffect(() => {
    reset(initialData || { surname: '', firstName: '', gender: '', dateOfBirth: '', idNumber: '' });
  }, [initialData, reset]);

  const onSubmit = (data: ExtractedIdData) => {
    onValidate(data);
  };

  const formFields: { name: keyof ExtractedIdData; label: string; icon: React.ElementType, placeholder: string, type?: string, options?: string[] }[] = [
    { name: 'surname', label: 'Surname', icon: User, placeholder: 'e.g. Doe' },
    { name: 'firstName', label: 'First Name', icon: User, placeholder: 'e.g. John' },
    { name: 'gender', label: 'Gender', icon: User, placeholder: 'Select Gender', type: 'select', options: ['M', 'F', 'Other'] },
    { name: 'dateOfBirth', label: 'Date of Birth', icon: CalendarDays, placeholder: 'YYYY-MM-DD', type: 'date' },
    { name: 'idNumber', label: 'ID Number', icon: FileText, placeholder: 'e.g. 123456789' },
  ];

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-2xl font-bold">
          <div className="p-2 bg-accent/10 rounded-lg mr-3">
            <Info className="h-6 w-6 text-accent" />
          </div>
          Extracted Information
        </CardTitle>
        <p className="text-muted-foreground">Review and edit the extracted data before validation</p>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formFields.map((field) => (
              <div key={field.name} className="space-y-3">
                <Label htmlFor={field.name} className="flex items-center text-sm font-semibold">
                  <field.icon className="mr-2 h-4 w-4 text-primary" />
                  {field.label}
                </Label>
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: controllerField }) => (
                    field.type === 'select' && field.options ? (
                       <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value} value={controllerField.value}>
                          <SelectTrigger 
                            id={field.name} 
                            aria-label={field.label}
                            className={`h-12 ${errors[field.name] ? 'border-destructive ring-destructive' : 'border-muted-foreground/20 focus:border-primary'}`}
                          >
                              <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                              {field.options.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        {...controllerField}
                        className={`h-12 ${errors[field.name] ? 'border-destructive ring-destructive' : 'border-muted-foreground/20 focus:border-primary'}`}
                        aria-invalid={errors[field.name] ? "true" : "false"}
                      />
                    )
                  )}
                />
                {errors[field.name] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {rawOcrText && (
             <div className="space-y-3">
                <Label htmlFor="rawOcrText" className="flex items-center text-sm font-semibold">
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    Raw OCR Text (Read-only)
                </Label>
                <textarea
                    id="rawOcrText"
                    readOnly
                    value={rawOcrText}
                    className="w-full h-32 p-4 border border-muted-foreground/20 rounded-lg bg-muted/30 text-sm font-mono resize-none focus:outline-none"
                    aria-label="Raw OCR Text"
                />
             </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-6 pt-6">
           {validationResult && validationResult.message && (
            <Alert 
              variant={validationResult.type === 'error' ? 'destructive' : 'default'} 
              className={`border-2 ${
                validationResult.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 
                validationResult.type === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : ''
              }`}
            >
              {validationResult.type === 'success' && <CheckCircle className="h-5 w-5" />}
              {validationResult.type === 'error' && <AlertTriangle className="h-5 w-5" />}
              {validationResult.type === 'info' && <Info className="h-5 w-5" />}
              <AlertTitle className="font-semibold">
                {validationResult.type === 'success' ? 'Validation Successful' : 
                 validationResult.type === 'error' ? 'Validation Issue' : 'Validation Info'}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {validationResult.message}
              </AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit" 
            disabled={isValidating || !initialData} 
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Validating with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-3 h-5 w-5" />
                Validate & Confirm Data with AI
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}