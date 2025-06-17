
'use server';

/**
 * @fileOverview Uses GenAI to fill in missing fields after OCR extraction.
 *
 * - improveExtractionQuality - A function that enhances the extracted data.
 * - ImproveExtractionQualityInput - The input type for the improveExtractionQuality function.
 * - ImproveExtractionQualityOutput - The return type for the improveExtractionQuality function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveExtractionQualityInputSchema = z.object({
  ocrText: z.string().describe('The OCR output text from the ID card image.'),
  surname: z.string().optional().describe('Extracted Surname, if available.'),
  firstName: z.string().optional().describe('Extracted First Name, if available.'),
  gender: z.string().optional().describe('Extracted Gender, if available.'),
  dateOfBirth: z.string().optional().describe('Extracted Date of Birth, if available.'),
  idNumber: z.string().optional().describe('Extracted ID number, if available.'),
});

export type ImproveExtractionQualityInput = z.infer<typeof ImproveExtractionQualityInputSchema>;

const ImproveExtractionQualityOutputSchema = z.object({
  surname: z.string().describe('Surname, filled by GenAI if missing.'),
  firstName: z.string().describe('First Name, filled by GenAI if missing.'),
  gender: z.string().describe('Gender, filled by GenAI if missing.'),
  dateOfBirth: z.string().describe('Date of Birth, filled by GenAI if missing.'),
  idNumber: z.string().describe('ID number, filled by GenAI if missing.'),
});

export type ImproveExtractionQualityOutput = z.infer<typeof ImproveExtractionQualityOutputSchema>;

export async function improveExtractionQuality(input: ImproveExtractionQualityInput): Promise<ImproveExtractionQualityOutput> {
  return improveExtractionQualityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveExtractionQualityPrompt',
  input: {schema: ImproveExtractionQualityInputSchema},
  output: {schema: ImproveExtractionQualityOutputSchema},
  prompt: `You are an expert data extraction specialist. You are given the OCR output from an ID card and the extracted fields.
  Your goal is to use the OCR output to fill in any missing fields.
  If a field is already present, do not change it.  Only fill in missing information.

  OCR Output:
  {{ocrText}}

  Extracted Fields:
  Surname: {{surname}}
  First Name: {{firstName}}
  Gender: {{gender}}
  Date of Birth: {{dateOfBirth}}
  ID Number: {{idNumber}}

  Fill in the missing fields using the OCR output. Return all fields, even if they were already present.
  Make sure that the Gender field is M or F.
  Ensure the Date of Birth field follows the YYYY-MM-DD format.
  Output in JSON format.
`,
});

const improveExtractionQualityFlow = ai.defineFlow(
  {
    name: 'improveExtractionQualityFlow',
    inputSchema: ImproveExtractionQualityInputSchema,
    outputSchema: ImproveExtractionQualityOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      ocrText: input.ocrText,
      surname: input.surname || '',
      firstName: input.firstName || '',
      gender: input.gender || '',
      dateOfBirth: input.dateOfBirth || '',
      idNumber: input.idNumber || '',
    });

    if (!output) {
      throw new Error("AI failed to generate improved extraction data. The response from the model was empty or invalid.");
    }
    return output;
  }
);
