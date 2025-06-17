'use client';

import type { ExtractedIdData } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { User, CalendarDays, FileText, CheckCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <Info className="mr-2 h-6 w-6 text-primary" /> Extracted Information
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {formFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label htmlFor={field.name} className="flex items-center text-sm font-medium">
                <field.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {field.label}
              </Label>
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  field.type === 'select' && field.options ? (
                     <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value} value={controllerField.value}>
                        <SelectTrigger id={field.name} aria-label={field.label}>
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
                      className={errors[field.name] ? 'border-destructive ring-destructive' : ''}
                      aria-invalid={errors[field.name] ? "true" : "false"}
                    />
                  )
                )}
              />
              {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]?.message}</p>}
            </div>
          ))}
          {rawOcrText && (
             <div className="space-y-1">
                <Label htmlFor="rawOcrText" className="flex items-center text-sm font-medium">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    Raw OCR Text (Read-only)
                </Label>
                <textarea
                    id="rawOcrText"
                    readOnly
                    value={rawOcrText}
                    className="w-full h-24 p-2 border rounded-md bg-muted/50 text-sm"
                    aria-label="Raw OCR Text"
                />
             </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
           {validationResult && validationResult.message && (
            <Alert variant={validationResult.type === 'error' ? 'destructive' : 'default'} className={
              validationResult.type === 'success' ? 'border-green-500 bg-green-50 text-green-700' : 
              validationResult.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
            }>
              {validationResult.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {validationResult.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {validationResult.type === 'info' && <Info className="h-4 w-4" />}
              <AlertTitle>{validationResult.type === 'success' ? 'Validation Successful' : validationResult.type === 'error' ? 'Validation Issue' : 'Validation Info'}</AlertTitle>
              <AlertDescription>
                {validationResult.message}
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isValidating || !initialData} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            {isValidating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isValidating ? 'Validating...' : 'Validate & Confirm Data with AI'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
