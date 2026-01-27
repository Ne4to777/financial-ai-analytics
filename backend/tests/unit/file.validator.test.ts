import { describe, it, expect } from 'vitest';
import { Readable } from 'stream';
import {
  validateFileMetadata,
  FileValidationErrorCode,
  DEFAULT_FILE_VALIDATION_CONFIG,
} from '../../src/validators/file.validator';
import { MultipartFile } from '@fastify/multipart';

/**
 * Create a mock MultipartFile for testing
 */
function createMockFile(
  filename: string,
  mimetype: string,
  content: string = 'test content'
): MultipartFile {
  const stream = Readable.from([content]);
  
  return {
    filename,
    mimetype,
    encoding: '7bit',
    fieldname: 'file',
    file: stream as any,
    fields: {},
    toBuffer: async () => Buffer.from(content),
  } as MultipartFile;
}

describe('validateFileMetadata', () => {
  describe('No file validation', () => {
    it('should return error when file is undefined', () => {
      const result = validateFileMetadata(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.NO_FILE);
      expect(result.errors[0]?.message).toContain('No file provided');
    });
  });

  describe('File extension validation', () => {
    it('should accept valid .csv extension', () => {
      const file = createMockFile('test.csv', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept uppercase .CSV extension', () => {
      const file = createMockFile('test.CSV', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject .txt extension', () => {
      const file = createMockFile('test.txt', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.INVALID_EXTENSION);
      expect(result.errors[0]?.message).toContain('Invalid file extension');
      expect(result.errors[0]?.details?.extension).toBe('.txt');
    });

    it('should reject .xlsx extension', () => {
      const file = createMockFile('test.xlsx', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.INVALID_EXTENSION);
    });

    it('should reject file without extension', () => {
      const file = createMockFile('test', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.INVALID_EXTENSION);
      expect(result.errors[0]?.details?.extension).toBe('');
    });
  });

  describe('MIME type validation', () => {
    it('should accept text/csv MIME type', () => {
      const file = createMockFile('test.csv', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept application/csv MIME type', () => {
      const file = createMockFile('test.csv', 'application/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept application/vnd.ms-excel MIME type', () => {
      const file = createMockFile('test.csv', 'application/vnd.ms-excel');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject application/json MIME type', () => {
      const file = createMockFile('test.csv', 'application/json');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.INVALID_MIME_TYPE);
      expect(result.errors[0]?.message).toContain('Invalid file type');
      expect(result.errors[0]?.details?.mimetype).toBe('application/json');
    });

    it('should reject application/octet-stream MIME type', () => {
      const file = createMockFile('test.csv', 'application/octet-stream');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.INVALID_MIME_TYPE);
    });

    it('should handle uppercase MIME types', () => {
      const file = createMockFile('test.csv', 'TEXT/CSV');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Multiple validation errors', () => {
    it('should return multiple errors for invalid extension and MIME type', () => {
      const file = createMockFile('test.txt', 'application/json');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.code).toBe(FileValidationErrorCode.INVALID_EXTENSION);
      expect(result.errors[1]?.code).toBe(FileValidationErrorCode.INVALID_MIME_TYPE);
    });
  });

  describe('Custom configuration', () => {
    it('should accept custom allowed extensions', () => {
      const file = createMockFile('test.txt', 'text/plain');
      const customConfig = {
        ...DEFAULT_FILE_VALIDATION_CONFIG,
        allowedExtensions: ['.txt'],
        allowedMimeTypes: ['text/plain'],
      };
      const result = validateFileMetadata(file, customConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject based on custom configuration', () => {
      const file = createMockFile('test.csv', 'text/csv');
      const customConfig = {
        ...DEFAULT_FILE_VALIDATION_CONFIG,
        allowedExtensions: ['.json'],
        allowedMimeTypes: ['application/json'],
      };
      const result = validateFileMetadata(file, customConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle file with multiple dots in filename', () => {
      const file = createMockFile('my.test.file.csv', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle file with spaces in filename', () => {
      const file = createMockFile('my test file.csv', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle file with unicode characters', () => {
      const file = createMockFile('тест_файл.csv', 'text/csv');
      const result = validateFileMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
