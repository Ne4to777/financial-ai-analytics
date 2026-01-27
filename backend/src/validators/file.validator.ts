import { MultipartFile } from '@fastify/multipart';
import path from 'path';

/**
 * Validation error codes
 */
export enum FileValidationErrorCode {
  NO_FILE = 'NO_FILE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_EXTENSION = 'INVALID_EXTENSION',
  INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
}

/**
 * File validation error
 */
export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
}

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
}

/**
 * Default validation configuration
 */
export const DEFAULT_FILE_VALIDATION_CONFIG: FileValidationConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.csv'],
  allowedMimeTypes: [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/octet-stream', // Common fallback for CSV files from various clients
  ],
};

/**
 * Validate uploaded file
 * 
 * @param file - Multipart file from request
 * @param config - Validation configuration (optional)
 * @returns Validation result with errors if any
 */
export async function validateFile(
  file: MultipartFile | undefined,
  config: FileValidationConfig = DEFAULT_FILE_VALIDATION_CONFIG
): Promise<FileValidationResult> {
  const errors: FileValidationError[] = [];

  // Check if file exists
  if (!file) {
    errors.push({
      code: FileValidationErrorCode.NO_FILE,
      message: 'No file provided. Please upload a file.',
    });
    return { valid: false, errors };
  }

  // Get file extension
  const fileExtension = path.extname(file.filename).toLowerCase();

  // Validate file extension
  if (!config.allowedExtensions.includes(fileExtension)) {
    errors.push({
      code: FileValidationErrorCode.INVALID_EXTENSION,
      message: `Invalid file extension. Expected ${config.allowedExtensions.join(', ')}, got ${fileExtension || 'none'}`,
      details: {
        filename: file.filename,
        extension: fileExtension,
        allowedExtensions: config.allowedExtensions,
      },
    });
  }

  // Validate MIME type
  const mimeType = file.mimetype.toLowerCase();
  if (!config.allowedMimeTypes.includes(mimeType)) {
    errors.push({
      code: FileValidationErrorCode.INVALID_MIME_TYPE,
      message: `Invalid file type. Expected ${config.allowedMimeTypes.join(', ')}, got ${mimeType}`,
      details: {
        filename: file.filename,
        mimetype: mimeType,
        allowedMimeTypes: config.allowedMimeTypes,
      },
    });
  }

  // Validate file size (read file to get size)
  const chunks: Buffer[] = [];
  let totalSize = 0;

  try {
    for await (const chunk of file.file) {
      chunks.push(chunk);
      totalSize += chunk.length;

      // Check if size exceeds limit while reading
      if (totalSize > config.maxSizeBytes) {
        errors.push({
          code: FileValidationErrorCode.FILE_TOO_LARGE,
          message: `File too large. Maximum size is ${formatBytes(config.maxSizeBytes)}, got ${formatBytes(totalSize)}+`,
          details: {
            filename: file.filename,
            maxSizeBytes: config.maxSizeBytes,
            actualSizeBytes: totalSize,
          },
        });
        break;
      }
    }
  } catch (error) {
    // If we can't read the file, that's a validation error
    errors.push({
      code: FileValidationErrorCode.NO_FILE,
      message: 'Unable to read file content',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Quick validation without reading file content (for size check)
 * Useful for preliminary checks before processing
 */
export function validateFileMetadata(
  file: MultipartFile | undefined,
  config: FileValidationConfig = DEFAULT_FILE_VALIDATION_CONFIG
): FileValidationResult {
  const errors: FileValidationError[] = [];

  // Check if file exists
  if (!file) {
    errors.push({
      code: FileValidationErrorCode.NO_FILE,
      message: 'No file provided. Please upload a file.',
    });
    return { valid: false, errors };
  }

  // Get file extension
  const fileExtension = path.extname(file.filename).toLowerCase();

  // Validate file extension
  if (!config.allowedExtensions.includes(fileExtension)) {
    errors.push({
      code: FileValidationErrorCode.INVALID_EXTENSION,
      message: `Invalid file extension. Expected ${config.allowedExtensions.join(', ')}, got ${fileExtension || 'none'}`,
      details: {
        filename: file.filename,
        extension: fileExtension,
        allowedExtensions: config.allowedExtensions,
      },
    });
  }

  // Validate MIME type
  const mimeType = file.mimetype.toLowerCase();
  if (!config.allowedMimeTypes.includes(mimeType)) {
    errors.push({
      code: FileValidationErrorCode.INVALID_MIME_TYPE,
      message: `Invalid file type. Expected ${config.allowedMimeTypes.join(', ')}, got ${mimeType}`,
      details: {
        filename: file.filename,
        mimetype: mimeType,
        allowedMimeTypes: config.allowedMimeTypes,
      },
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
