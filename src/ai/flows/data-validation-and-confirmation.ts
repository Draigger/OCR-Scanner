
'use server';
/**
 * @fileOverview Validates and confirms extracted ID card data using GenAI.
 *
 * - validateAndConfirmData - A function that validates and confirms the extracted ID card data.
 * - ValidateAndConfirmDataInput - The input type for the validateAndConfirmData function.
 * - ValidateAndConfirmDataOutput - The return type for the validateAndConfirmData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAndConfirmDataInputSchema = z.object({
  surname: z.string().describe('The surname extracted from the ID card.'),
  firstName: z.string().describe('The first name extracted from the ID card.'),
  gender: z.string().describe('The gender extracted from the ID card.'),
  dateOfBirth: z.string().describe('The date of birth extracted from the ID card.'),
  idNumber: z.string().describe('The ID number extracted from the ID card.'),
});
export type ValidateAndConfirmDataInput = z.infer<typeof ValidateAndConfirmDataInputSchema>;

const ValidateAndConfirmDataOutputSchema = z.object({
  validationResult: z.string().describe('A summary of the validation results, highlighting any potential errors or inconsistencies.'),
});
export type ValidateAndConfirmDataOutput = z.infer<typeof ValidateAndConfirmDataOutputSchema>;

export async function validateAndConfirmData(input: ValidateAndConfirmDataInput): Promise<ValidateAndConfirmDataOutput> {
  return validateAndConfirmDataFlow(input);
}

const validateAndConfirmDataPrompt = ai.definePrompt({
  name: 'validateAndConfirmDataPrompt',
  input: {schema: ValidateAndConfirmDataInputSchema},
  output: {schema: ValidateAndConfirmDataOutputSchema},
  prompt: `You are an expert in data validation and identity verification.
  Your task is to validate the information extracted from an ID card and identify any potential errors or inconsistencies.

  Here is the extracted data:
  - Surname: {{{surname}}}
  - First Name: {{{firstName}}}
  - Gender: {{{gender}}}
  - Date of Birth: {{{dateOfBirth}}}
  - ID Number: {{{idNumber}}}

  Analyze this information and provide a summary of your validation results.
  Highlight any potentially incorrect or inconsistent information. Be concise and clear in your assessment.
  Ensure your output conforms to the ValidationResultSchema description.
  `,
});

const validateAndConfirmDataFlow = ai.defineFlow(
  {
    name: 'validateAndConfirmDataFlow',
    inputSchema: ValidateAndConfirmDataInputSchema,
    outputSchema: ValidateAndConfirmDataOutputSchema,
  },
  async input => {
    const {output} = await validateAndConfirmDataPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate validation data. The response from the model was empty or invalid.");
    }
    return output;
  }
);
