/**
 * Centralized Error System
 * 
 * Provides custom error classes for consistent error handling across the application
 */

/**
 * HTTP Status Codes
 */
export enum HTTPStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Application Error Codes
 */
export enum AppErrorCode {
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // File Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_STORAGE_ERROR = 'FILE_STORAGE_ERROR',
  
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  
  // CSV Errors
  CSV_PARSE_ERROR = 'CSV_PARSE_ERROR',
  CSV_MISSING_COLUMNS = 'CSV_MISSING_COLUMNS',
  CSV_INVALID_STRUCTURE = 'CSV_INVALID_STRUCTURE',
  CSV_EMPTY_FILE = 'CSV_EMPTY_FILE',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_INSERT_ERROR = 'DATABASE_INSERT_ERROR',
  DATABASE_UPDATE_ERROR = 'DATABASE_UPDATE_ERROR',
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: AppErrorCode = AppErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTPStatus.INTERNAL_SERVER_ERROR,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for API response
   */
  toJSON() {
    const result: Record<string, unknown> = {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
      },
    };

    if (this.details) {
      (result.error as Record<string, unknown>).details = this.details;
    }

    return result;
  }
}

/**
 * File-related errors
 */
export class FileError extends AppError {
  constructor(
    message: string,
    code: AppErrorCode = AppErrorCode.FILE_UPLOAD_FAILED,
    details?: unknown
  ) {
    super(message, code, HTTPStatus.BAD_REQUEST, details);
  }

  static fileTooLarge(maxSize: number, actualSize: number): FileError {
    return new FileError(
      `File too large. Maximum size is ${maxSize} bytes`,
      AppErrorCode.FILE_TOO_LARGE,
      { maxSize, actualSize }
    );
  }

  static invalidFileType(
    expected: string[],
    actual: string
  ): FileError {
    return new FileError(
      `Invalid file type. Expected ${expected.join(', ')} but got ${actual}`,
      AppErrorCode.INVALID_FILE_TYPE,
      { expected, actual }
    );
  }

  static fileNotFound(filename: string): FileError {
    return new FileError(
      `File not found: ${filename}`,
      AppErrorCode.FILE_NOT_FOUND,
      { filename }
    );
  }

  static storageError(message: string, details?: unknown): FileError {
    return new FileError(
      message,
      AppErrorCode.FILE_STORAGE_ERROR,
      details
    );
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[];

  constructor(
    message: string,
    errors: ValidationErrorDetail[] = [],
    code: AppErrorCode = AppErrorCode.VALIDATION_FAILED
  ) {
    super(message, code, HTTPStatus.BAD_REQUEST, { errors });
    this.errors = errors;
  }

  /**
   * Create validation error from field errors
   */
  static fromFields(
    fieldErrors: Record<string, string>,
    message: string = 'Validation failed'
  ): ValidationError {
    const errors: ValidationErrorDetail[] = Object.entries(fieldErrors).map(
      ([field, error]) => ({
        field,
        message: error,
      })
    );

    return new ValidationError(message, errors);
  }

  /**
   * Create validation error for single field
   */
  static singleField(
    field: string,
    message: string,
    value?: unknown,
    suggestion?: string
  ): ValidationError {
    return new ValidationError('Validation failed', [
      {
        field,
        message,
        value,
        suggestion,
      },
    ]);
  }

  /**
   * CSV missing required columns
   */
  static missingColumns(
    required: string[],
    found: string[]
  ): ValidationError {
    return new ValidationError(
      'CSV file is missing required columns',
      [
        {
          field: 'columns',
          message: `Required columns: ${required.join(', ')}. Found: ${found.join(', ')}`,
          value: found,
          suggestion: `Add missing columns: ${required.filter((c) => !found.includes(c)).join(', ')}`,
        },
      ],
      AppErrorCode.CSV_MISSING_COLUMNS
    );
  }

  /**
   * CSV empty file
   */
  static emptyCSV(): ValidationError {
    return new ValidationError(
      'CSV file is empty',
      [],
      AppErrorCode.CSV_EMPTY_FILE
    );
  }

  /**
   * CSV parse error
   */
  static csvParseError(message: string): ValidationError {
    return new ValidationError(
      `Failed to parse CSV: ${message}`,
      [],
      AppErrorCode.CSV_PARSE_ERROR
    );
  }

  /**
   * Serialize error for API response
   */
  override toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
        errors: this.errors,
      },
    };
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    code: AppErrorCode = AppErrorCode.DATABASE_ERROR,
    details?: unknown
  ) {
    super(message, code, HTTPStatus.INTERNAL_SERVER_ERROR, details);
  }

  static connectionError(details?: unknown): DatabaseError {
    return new DatabaseError(
      'Database connection failed',
      AppErrorCode.DATABASE_CONNECTION_ERROR,
      details
    );
  }

  static queryError(query: string, additionalDetails?: unknown): DatabaseError {
    const errorDetails: Record<string, unknown> = { query };
    if (additionalDetails && typeof additionalDetails === 'object') {
      Object.assign(errorDetails, additionalDetails);
    }
    return new DatabaseError(
      'Database query failed',
      AppErrorCode.DATABASE_QUERY_ERROR,
      errorDetails
    );
  }

  static insertError(table: string, additionalDetails?: unknown): DatabaseError {
    const errorDetails: Record<string, unknown> = { table };
    if (additionalDetails && typeof additionalDetails === 'object') {
      Object.assign(errorDetails, additionalDetails);
    }
    return new DatabaseError(
      `Failed to insert into ${table}`,
      AppErrorCode.DATABASE_INSERT_ERROR,
      errorDetails
    );
  }

  static updateError(table: string, additionalDetails?: unknown): DatabaseError {
    const errorDetails: Record<string, unknown> = { table };
    if (additionalDetails && typeof additionalDetails === 'object') {
      Object.assign(errorDetails, additionalDetails);
    }
    return new DatabaseError(
      `Failed to update ${table}`,
      AppErrorCode.DATABASE_UPDATE_ERROR,
      errorDetails
    );
  }

  static constraintError(constraint: string, additionalDetails?: unknown): DatabaseError {
    const errorDetails: Record<string, unknown> = { constraint };
    if (additionalDetails && typeof additionalDetails === 'object') {
      Object.assign(errorDetails, additionalDetails);
    }
    return new DatabaseError(
      `Database constraint violation: ${constraint}`,
      AppErrorCode.DATABASE_CONSTRAINT_ERROR,
      errorDetails
    );
  }

  static notFound(resource: string, id?: string): DatabaseError {
    return new DatabaseError(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      AppErrorCode.RECORD_NOT_FOUND,
      { resource, id }
    );
  }
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field?: string;
  message: string;
  value?: unknown;
  row?: number;
  suggestion?: string;
}

/**
 * Check if error is operational (expected) vs programmer error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 */
export function formatError(error: Error) {
  if (error instanceof AppError) {
    return error.toJSON();
  }

  // Unknown error - don't expose internals
  return {
    error: {
      code: AppErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Map common errors to AppError
 */
export function mapError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('ENOENT')) {
      return FileError.fileNotFound(error.message);
    }

    if (error.message.includes('CSV')) {
      return ValidationError.csvParseError(error.message);
    }

    // Default to internal server error
    return new AppError(
      error.message,
      AppErrorCode.INTERNAL_SERVER_ERROR,
      HTTPStatus.INTERNAL_SERVER_ERROR,
      { originalError: error.name },
      false // Programmer error
    );
  }

  // Unknown error type
  return new AppError(
    'An unexpected error occurred',
    AppErrorCode.UNKNOWN_ERROR,
    HTTPStatus.INTERNAL_SERVER_ERROR,
    undefined,
    false
  );
}
