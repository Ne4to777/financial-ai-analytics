import { describe, it, expect } from 'vitest';
import {
  AppError,
  FileError,
  ValidationError,
  DatabaseError,
  AppErrorCode,
  HTTPStatus,
  isOperationalError,
  formatError,
  mapError,
} from '../../src/utils/errors';

describe('Error System', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError(
        'Test error',
        AppErrorCode.INTERNAL_SERVER_ERROR,
        HTTPStatus.INTERNAL_SERVER_ERROR,
        { detail: 'test' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(AppErrorCode.INTERNAL_SERVER_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    it('should use default values', () => {
      const error = new AppError('Test error');

      expect(error.code).toBe(AppErrorCode.INTERNAL_SERVER_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should serialize to JSON', () => {
      const error = new AppError(
        'Test error',
        AppErrorCode.INTERNAL_SERVER_ERROR,
        500,
        { detail: 'test' }
      );

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: AppErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Test error',
          timestamp: error.timestamp,
          details: { detail: 'test' },
        },
      });
    });

    it('should not include details if undefined', () => {
      const error = new AppError('Test error');
      const json = error.toJSON();

      expect(json.error).not.toHaveProperty('details');
    });
  });

  describe('FileError', () => {
    it('should create file error', () => {
      const error = new FileError('File error');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(FileError);
      expect(error.statusCode).toBe(HTTPStatus.BAD_REQUEST);
      expect(error.code).toBe(AppErrorCode.FILE_UPLOAD_FAILED);
    });

    it('should create fileTooLarge error', () => {
      const error = FileError.fileTooLarge(1000, 2000);

      expect(error.message).toContain('too large');
      expect(error.code).toBe(AppErrorCode.FILE_TOO_LARGE);
      expect(error.details).toEqual({ maxSize: 1000, actualSize: 2000 });
    });

    it('should create invalidFileType error', () => {
      const error = FileError.invalidFileType(['csv', 'txt'], 'pdf');

      expect(error.message).toContain('Invalid file type');
      expect(error.code).toBe(AppErrorCode.INVALID_FILE_TYPE);
      expect(error.details).toEqual({ expected: ['csv', 'txt'], actual: 'pdf' });
    });

    it('should create fileNotFound error', () => {
      const error = FileError.fileNotFound('test.csv');

      expect(error.message).toContain('not found');
      expect(error.code).toBe(AppErrorCode.FILE_NOT_FOUND);
      expect(error.details).toEqual({ filename: 'test.csv' });
    });

    it('should create storageError', () => {
      const error = FileError.storageError('Storage failed', { reason: 'disk full' });

      expect(error.message).toBe('Storage failed');
      expect(error.code).toBe(AppErrorCode.FILE_STORAGE_ERROR);
      expect(error.details).toEqual({ reason: 'disk full' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be positive' },
      ];

      const error = new ValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(HTTPStatus.BAD_REQUEST);
      expect(error.code).toBe(AppErrorCode.VALIDATION_FAILED);
      expect(error.errors).toEqual(errors);
    });

    it('should create from field errors', () => {
      const fieldErrors = {
        email: 'Invalid email',
        age: 'Must be positive',
      };

      const error = ValidationError.fromFields(fieldErrors);

      expect(error.message).toBe('Validation failed');
      expect(error.errors).toHaveLength(2);
      expect(error.errors[0].field).toBe('email');
      expect(error.errors[0].message).toBe('Invalid email');
    });

    it('should create single field error', () => {
      const error = ValidationError.singleField(
        'amount',
        'Must be positive',
        -100,
        'Use positive numbers only'
      );

      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toEqual({
        field: 'amount',
        message: 'Must be positive',
        value: -100,
        suggestion: 'Use positive numbers only',
      });
    });

    it('should create missingColumns error', () => {
      const error = ValidationError.missingColumns(
        ['date', 'amount', 'category'],
        ['date', 'amount']
      );

      expect(error.message).toContain('missing required columns');
      expect(error.code).toBe(AppErrorCode.CSV_MISSING_COLUMNS);
      expect(error.errors[0].suggestion).toContain('category');
    });

    it('should create emptyCSV error', () => {
      const error = ValidationError.emptyCSV();

      expect(error.message).toBe('CSV file is empty');
      expect(error.code).toBe(AppErrorCode.CSV_EMPTY_FILE);
      expect(error.errors).toHaveLength(0);
    });

    it('should create csvParseError', () => {
      const error = ValidationError.csvParseError('Invalid delimiter');

      expect(error.message).toContain('Failed to parse CSV');
      expect(error.code).toBe(AppErrorCode.CSV_PARSE_ERROR);
    });

    it('should serialize with errors array', () => {
      const error = new ValidationError('Test', [
        { field: 'test', message: 'Test error' },
      ]);

      const json = error.toJSON();

      expect(json.error.errors).toBeDefined();
      expect(json.error.errors).toHaveLength(1);
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const error = new DatabaseError('DB error');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.statusCode).toBe(HTTPStatus.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(AppErrorCode.DATABASE_ERROR);
    });

    it('should create connectionError', () => {
      const error = DatabaseError.connectionError({ host: 'localhost' });

      expect(error.message).toContain('connection failed');
      expect(error.code).toBe(AppErrorCode.DATABASE_CONNECTION_ERROR);
      expect(error.details).toEqual({ host: 'localhost' });
    });

    it('should create queryError', () => {
      const error = DatabaseError.queryError('SELECT * FROM users');

      expect(error.message).toContain('query failed');
      expect(error.code).toBe(AppErrorCode.DATABASE_QUERY_ERROR);
      expect(error.details).toHaveProperty('query');
    });

    it('should create insertError', () => {
      const error = DatabaseError.insertError('uploads');

      expect(error.message).toContain('insert');
      expect(error.message).toContain('uploads');
      expect(error.code).toBe(AppErrorCode.DATABASE_INSERT_ERROR);
    });

    it('should create updateError', () => {
      const error = DatabaseError.updateError('users');

      expect(error.message).toContain('update');
      expect(error.message).toContain('users');
      expect(error.code).toBe(AppErrorCode.DATABASE_UPDATE_ERROR);
    });

    it('should create constraintError', () => {
      const error = DatabaseError.constraintError('unique_email');

      expect(error.message).toContain('constraint violation');
      expect(error.code).toBe(AppErrorCode.DATABASE_CONSTRAINT_ERROR);
      expect(error.details).toHaveProperty('constraint', 'unique_email');
    });

    it('should create notFound error', () => {
      const error = DatabaseError.notFound('Upload', 'abc-123');

      expect(error.message).toContain('not found');
      expect(error.code).toBe(AppErrorCode.RECORD_NOT_FOUND);
      expect(error.details).toEqual({ resource: 'Upload', id: 'abc-123' });
    });

    it('should create notFound error without ID', () => {
      const error = DatabaseError.notFound('Upload');

      expect(error.message).toContain('Upload not found');
      expect(error.details).toEqual({ resource: 'Upload', id: undefined });
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational AppError', () => {
      const error = new AppError('Test', AppErrorCode.INTERNAL_SERVER_ERROR, 500, undefined, true);

      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational AppError', () => {
      const error = new AppError('Test', AppErrorCode.INTERNAL_SERVER_ERROR, 500, undefined, false);

      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');

      expect(isOperationalError(error)).toBe(false);
    });
  });

  describe('formatError', () => {
    it('should format AppError', () => {
      const error = new AppError('Test', AppErrorCode.VALIDATION_FAILED, 400);
      const formatted = formatError(error);

      expect(formatted).toHaveProperty('error');
      expect(formatted.error.code).toBe(AppErrorCode.VALIDATION_FAILED);
      expect(formatted.error.message).toBe('Test');
    });

    it('should format unknown error without exposing internals', () => {
      const error = new Error('Internal error');
      const formatted = formatError(error);

      expect(formatted.error.message).toBe('An unexpected error occurred');
      expect(formatted.error.code).toBe(AppErrorCode.INTERNAL_SERVER_ERROR);
      expect(formatted.error).not.toHaveProperty('stack');
    });
  });

  describe('mapError', () => {
    it('should return AppError as is', () => {
      const error = new AppError('Test');
      const mapped = mapError(error);

      expect(mapped).toBe(error);
    });

    it('should map ENOENT error to FileError', () => {
      const error = new Error('ENOENT: file not found');
      const mapped = mapError(error);

      expect(mapped).toBeInstanceOf(FileError);
      expect(mapped.code).toBe(AppErrorCode.FILE_NOT_FOUND);
    });

    it('should map CSV error to ValidationError', () => {
      const error = new Error('CSV parsing failed');
      const mapped = mapError(error);

      expect(mapped).toBeInstanceOf(ValidationError);
      expect(mapped.code).toBe(AppErrorCode.CSV_PARSE_ERROR);
    });

    it('should map unknown Error to AppError', () => {
      const error = new Error('Unknown error');
      const mapped = mapError(error);

      expect(mapped).toBeInstanceOf(AppError);
      expect(mapped.code).toBe(AppErrorCode.INTERNAL_SERVER_ERROR);
      expect(mapped.isOperational).toBe(false);
    });

    it('should map unknown type to AppError', () => {
      const error = 'string error';
      const mapped = mapError(error);

      expect(mapped).toBeInstanceOf(AppError);
      expect(mapped.code).toBe(AppErrorCode.UNKNOWN_ERROR);
      expect(mapped.isOperational).toBe(false);
    });
  });
});
