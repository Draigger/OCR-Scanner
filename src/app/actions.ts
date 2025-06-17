
'use server';

import { performOcr } from '@/lib/ocr';
import type { ExtractedIdData, OcrSpaceResponse } from '@/types';
import { improveExtractionQuality, ImproveExtractionQualityInput } from '@/ai/flows/improve-extraction-quality';
import { validateAndConfirmData, ValidateAndConfirmDataInput } from '@/ai/flows/data-validation-and-confirmation';
import { z } from 'zod';

export async function processImage(base64Image: string): Promise<{ data?: ExtractedIdData | null; error?: string; rawOcrText?: string | null; usesDefaultKey: boolean }> {
  const usesDefaultKey = !process.env.OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY === 'helloworld';
  try {
    const ocrResult: OcrSpaceResponse = await performOcr(base64Image);

    if (ocrResult.IsErroredOnProcessing || !ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
      return { error: `OCR processing failed: ${ocrResult.ErrorMessage?.join(', ') || 'Unknown OCR error'}`, rawOcrText: null, data: null, usesDefaultKey };
    }

    const rawOcrText = ocrResult.ParsedResults[0].ParsedText;
    if (!rawOcrText || rawOcrText.trim() === '') {
      return { error: 'No text found by OCR.', rawOcrText: "", data: null, usesDefaultKey };
    }

    const extractionInput: ImproveExtractionQualityInput = {
      ocrText: rawOcrText,
    };
    
    const extractedData = await improveExtractionQuality(extractionInput);
    
    const dobSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be in YYYY-MM-DD format.");
    const parsedDob = dobSchema.safeParse(extractedData.dateOfBirth);
    
    let finalDateOfBirth = extractedData.dateOfBirth;
    if (!parsedDob.success) {
      try {
        const date = new Date(extractedData.dateOfBirth);
        if (!isNaN(date.getTime())) {
          finalDateOfBirth = date.toISOString().split('T')[0];
        } else {
          console.warn(`Date of Birth "${extractedData.dateOfBirth}" is not in YYYY-MM-DD format and could not be auto-corrected.`);
        }
      } catch (e) {
        console.warn(`Error parsing date "${extractedData.dateOfBirth}": ${e}`);
      }
    }

    return { 
      data: {
        ...extractedData,
        dateOfBirth: finalDateOfBirth,
        gender: ['M', 'F'].includes(extractedData.gender.toUpperCase()) ? extractedData.gender.toUpperCase() : extractedData.gender
      }, 
      rawOcrText,
      usesDefaultKey
    };

  } catch (e: unknown) {
    console.error('Error in processImage action:', e);
    let message = 'An unexpected error occurred during image processing.';
    if (e instanceof Error) {
      message = e.message;
    } else if (typeof e === 'string') {
      message = e;
    } else {
      // Attempt to get a message from an object, or stringify
      if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
        message = e.message;
      } else {
        try {
          message = `Non-standard error: ${JSON.stringify(e)}`;
        } catch (stringifyError) {
          // message remains the default
        }
      }
    }
    return { error: message, rawOcrText: null, data: null, usesDefaultKey };
  }
}

export async function validateDataWithAI(data: ExtractedIdData): Promise<{ validationResult?: string | null; error?: string }> {
  try {
    const validationInput: ValidateAndConfirmDataInput = {
      surname: data.surname,
      firstName: data.firstName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      idNumber: data.idNumber,
    };

    const result = await validateAndConfirmData(validationInput);
    return { validationResult: result.validationResult };

  } catch (e: unknown) {
    console.error('Error in validateDataWithAI action:', e);
    let message = 'An unexpected error occurred during data validation.';
     if (e instanceof Error) {
      message = e.message;
    } else if (typeof e === 'string') {
      message = e;
    } else {
      // Attempt to get a message from an object, or stringify
      if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
        message = e.message;
      } else {
        try {
          message = `Non-standard error: ${JSON.stringify(e)}`;
        } catch (stringifyError) {
          // message remains the default
        }
      }
    }
    return { error: message, validationResult: null };
  }
}
