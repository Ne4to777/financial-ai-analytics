import { describe, it, expect } from 'vitest';
import {
  UploadResponse,
  UploadSuccessResponse,
  UploadErrorResponse,
  APIErrorCode,
  HTTPStatusCode,
  REQUIRED_COLUMNS,
  OPTIONAL_COLUMNS,
  ALL_COLUMNS,
  isUploadSuccess,
  isUploadError,
  Transaction,
  ValidationError,
} from '../../src/types';

describe('Upload Types', () => {
  describe('Type Guards', () => {
    it('should identify success response with isUploadSuccess', () => {
      const successResponse: UploadResponse = {
        success: true,
        message: 'Upload successful',
        data: {
          uploadId: '123',
          file: {
            filename: 'test.csv',
            mimetype: 'text/csv',
            encoding: '7bit',
            size: 1024,
          },
          csv: {
            totalRows: 10,
            totalColumns: 4,
            columns: ['date', 'amount', 'category', 'description'],
            delimiter: ',',
            linebreak: '\n',
            hasErrors: false,
            errorCount: 0,
          },
          preview: [],
          statistics: {
            totalRows: 10,
            validRows: 10,
            invalidRows: 0,
            warnings: 0,
          },
          receivedAt: new Date().toISOString(),
          processingTime: 100,
        },
      };

      expect(isUploadSuccess(successResponse)).toBe(true);
      expect(isUploadError(successResponse)).toBe(false);

      if (isUploadSuccess(successResponse)) {
        // TypeScript should infer this as UploadSuccessResponse
        expect(successResponse.data.uploadId).toBe('123');
      }
    });

    it('should identify error response with isUploadError', () => {
      const errorResponse: UploadResponse = {
        success: false,
        error: {
          code: APIErrorCode.NO_FILE,
          message: 'No file uploaded',
        },
      };

      expect(isUploadError(errorResponse)).toBe(true);
      expect(isUploadSuccess(errorResponse)).toBe(false);

      if (isUploadError(errorResponse)) {
        // TypeScript should infer this as UploadErrorResponse
        expect(errorResponse.error.code).toBe(APIErrorCode.NO_FILE);
      }
    });
  });

  describe('Constants', () => {
    it('should have correct required columns', () => {
      expect(REQUIRED_COLUMNS).toEqual(['date', 'amount', 'category']);
      expect(REQUIRED_COLUMNS).toHaveLength(3);
    });

    it('should have correct optional columns', () => {
      expect(OPTIONAL_COLUMNS).toEqual(['description']);
      expect(OPTIONAL_COLUMNS).toHaveLength(1);
    });

    it('should have all columns combined', () => {
      expect(ALL_COLUMNS).toEqual(['date', 'amount', 'category', 'description']);
      expect(ALL_COLUMNS).toHaveLength(4);
    });
  });

  describe('Enums', () => {
    it('should have APIErrorCode enum with expected values', () => {
      expect(APIErrorCode.NO_FILE).toBe('NO_FILE');
      expect(APIErrorCode.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
      expect(APIErrorCode.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE');
      expect(APIErrorCode.CSV_PARSE_ERROR).toBe('CSV_PARSE_ERROR');
      expect(APIErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(APIErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });

    it('should have HTTPStatusCode enum with expected values', () => {
      expect(HTTPStatusCode.OK).toBe(200);
      expect(HTTPStatusCode.BAD_REQUEST).toBe(400);
      expect(HTTPStatusCode.UNAUTHORIZED).toBe(401);
      expect(HTTPStatusCode.NOT_FOUND).toBe(404);
      expect(HTTPStatusCode.PAYLOAD_TOO_LARGE).toBe(413);
      expect(HTTPStatusCode.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow valid Transaction object', () => {
      const transaction: Transaction = {
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
        description: 'Monthly salary',
      };

      expect(transaction.date).toBe('2024-01-15');
      expect(transaction.amount).toBe('1500.00');
      expect(transaction.category).toBe('Salary');
      expect(transaction.description).toBe('Monthly salary');
    });

    it('should allow Transaction without optional description', () => {
      const transaction: Transaction = {
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
      };

      expect(transaction.description).toBeUndefined();
    });

    it('should allow valid ValidationError object', () => {
      const error: ValidationError = {
        row: 5,
        column: 'amount',
        code: 'INVALID_FORMAT',
        message: 'Amount must be a number',
        value: 'abc',
        suggestion: 'Use format: 1500.00',
      };

      expect(error.row).toBe(5);
      expect(error.column).toBe('amount');
      expect(error.code).toBe('INVALID_FORMAT');
    });
  });

  describe('Response Structure', () => {
    it('should construct valid success response', () => {
      const response: UploadSuccessResponse = {
        success: true,
        message: 'CSV file processed successfully',
        data: {
          uploadId: 'upload_123',
          file: {
            filename: 'transactions.csv',
            mimetype: 'text/csv',
            encoding: '7bit',
            size: 2048,
          },
          csv: {
            totalRows: 5,
            totalColumns: 4,
            columns: ['date', 'amount', 'category', 'description'],
            delimiter: ',',
            linebreak: '\n',
            hasErrors: false,
            errorCount: 0,
          },
          preview: [
            { date: '2024-01-15', amount: '1500.00', category: 'Salary', description: 'Payment' },
            { date: '2024-01-16', amount: '-50.00', category: 'Groceries', description: 'Shopping' },
          ],
          statistics: {
            totalRows: 5,
            validRows: 5,
            invalidRows: 0,
            warnings: 0,
          },
          receivedAt: '2024-01-27T10:00:00.000Z',
          processingTime: 250,
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.uploadId).toBe('upload_123');
      expect(response.data.csv.totalRows).toBe(5);
      expect(response.data.preview).toHaveLength(2);
    });

    it('should construct valid error response', () => {
      const response: UploadErrorResponse = {
        success: false,
        error: {
          code: APIErrorCode.MISSING_REQUIRED_COLUMNS,
          message: 'Required columns are missing',
          details: {
            missing: ['date', 'amount'],
          },
        },
        validationErrors: [
          {
            code: 'MISSING_COLUMN',
            message: 'Column "date" is required',
            column: 'date',
          },
          {
            code: 'MISSING_COLUMN',
            message: 'Column "amount" is required',
            column: 'amount',
          },
        ],
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(APIErrorCode.MISSING_REQUIRED_COLUMNS);
      expect(response.validationErrors).toHaveLength(2);
    });
  });
});
