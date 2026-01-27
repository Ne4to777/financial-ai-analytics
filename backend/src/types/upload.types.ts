/**
 * Upload API Types
 * 
 * Type definitions for CSV file upload and processing
 */

/**
 * File metadata from multipart upload
 */
export interface FileMetadata {
  filename: string;
  mimetype: string;
  encoding: string;
  size: number;
}

/**
 * Stored file information
 */
export interface StoredFileInfo {
  filename: string;
  originalFilename: string;
  path: string;
  size: number;
  savedAt: string;
}

/**
 * CSV column information
 */
export interface CSVColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

/**
 * Parsed CSV metadata
 */
export interface ParsedCSVMetadata {
  totalRows: number;
  totalColumns: number;
  columns: string[];
  delimiter: string;
  linebreak: string;
  hasErrors: boolean;
  errorCount: number;
}

/**
 * CSV row data (generic)
 */
export type CSVRow = Record<string, unknown>;

/**
 * Transaction data from CSV
 */
export interface Transaction {
  date: string;
  amount: string;
  category: string;
  description?: string;
}

/**
 * Validation error for a specific field/row
 */
export interface ValidationError {
  row?: number;
  column?: string;
  code: string;
  message: string;
  value?: unknown;
  suggestion?: string;
}

/**
 * Upload validation result
 */
export interface UploadValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * CSV parsing result
 */
export interface CSVParseResult {
  success: boolean;
  data?: {
    rows: CSVRow[];
    metadata: ParsedCSVMetadata;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Upload processing result
 */
export interface UploadProcessingResult {
  fileValidation: UploadValidationResult;
  csvParsing: CSVParseResult;
  dataValidation?: UploadValidationResult;
}

/**
 * Successful upload response
 */
export interface UploadSuccessResponse {
  success: true;
  message: string;
  data: {
    uploadId: string;
    file: FileMetadata;
    csv: ParsedCSVMetadata;
    preview: CSVRow[];
    statistics: {
      totalRows: number;
      validRows: number;
      invalidRows: number;
      warnings: number;
    };
    receivedAt: string;
    processingTime: number;
  };
}

/**
 * Failed upload response
 */
export interface UploadErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  validationErrors?: ValidationError[];
}

/**
 * Upload response (union type)
 */
export type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

/**
 * API error codes
 */
export enum APIErrorCode {
  // File errors
  NO_FILE = 'NO_FILE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_EXTENSION = 'INVALID_EXTENSION',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  DISK_FULL = 'DISK_FULL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // CSV parsing errors
  CSV_PARSE_ERROR = 'CSV_PARSE_ERROR',
  CSV_EMPTY = 'CSV_EMPTY',
  CSV_NO_HEADERS = 'CSV_NO_HEADERS',
  CSV_MALFORMED = 'CSV_MALFORMED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_COLUMNS = 'MISSING_REQUIRED_COLUMNS',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
}

/**
 * HTTP status codes for API responses
 */
export enum HTTPStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  REQUEST_TIMEOUT = 408,
  PAYLOAD_TOO_LARGE = 413,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Required CSV columns for financial transactions
 */
export const REQUIRED_COLUMNS = ['date', 'amount', 'category'] as const;

/**
 * Optional CSV columns
 */
export const OPTIONAL_COLUMNS = ['description'] as const;

/**
 * All valid CSV columns
 */
export const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

/**
 * Column type for type-safe column names
 */
export type ColumnName = typeof ALL_COLUMNS[number];

/**
 * Type guard to check if value is UploadSuccessResponse
 */
export function isUploadSuccess(
  response: UploadResponse
): response is UploadSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if value is UploadErrorResponse
 */
export function isUploadError(
  response: UploadResponse
): response is UploadErrorResponse {
  return response.success === false;
}
