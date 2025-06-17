import type { OcrSpaceResponse } from '@/types';

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'; // Use 'helloworld' for free tier testing or set your key

export async function performOcr(base64Image: string): Promise<OcrSpaceResponse> {
  if (OCR_SPACE_API_KEY === 'helloworld' && !process.env.OCR_SPACE_API_KEY) {
    console.warn("Using default OCR.space API key. This is rate-limited. For better performance, set your own OCR_SPACE_API_KEY environment variable.");
  }

  const formData = new FormData();
  formData.append('base64Image', base64Image);
  formData.append('apikey', OCR_SPACE_API_KEY);
  formData.append('language', 'eng'); // Adjust language if needed
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');


  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR.space API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as OcrSpaceResponse;
    if (data.IsErroredOnProcessing || data.OCRExitCode !== 1) {
      throw new Error(`OCR.space processing error: ${data.ErrorMessage?.join(', ') || 'Unknown error'}`);
    }
    return data;
  } catch (error) {
    console.error("Error in performOcr:", error);
    throw error;
  }
}
