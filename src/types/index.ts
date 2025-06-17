export interface ExtractedIdData {
  surname: string;
  firstName: string;
  gender: string; // "M" or "F" or other, AI flow might standardize
  dateOfBirth: string; // "YYYY-MM-DD"
  idNumber: string;
}

export interface OcrSpaceResponse {
  ParsedResults: {
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }[];
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ProcessingTimeInMilliseconds: string;
  SearchablePDFURL?: string;
  ErrorMessage?: string[];
}
