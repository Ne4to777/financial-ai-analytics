/**
 * Date Utilities
 * 
 * Provides date parsing, validation, and normalization utilities
 * for handling multiple date formats in CSV data.
 */

/**
 * Supported date formats
 */
export enum DateFormat {
  ISO = 'YYYY-MM-DD',
  EUROPEAN = 'DD.MM.YYYY',
  US = 'DD/MM/YYYY',
}

/**
 * Date validation error codes
 */
export enum DateValidationErrorCode {
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_DATE = 'INVALID_DATE',
  FUTURE_DATE = 'FUTURE_DATE',
  TOO_OLD = 'TOO_OLD',
}

/**
 * Date validation result
 */
export interface DateValidationResult {
  valid: boolean;
  normalizedDate?: string; // ISO format (YYYY-MM-DD)
  parsedDate?: Date;
  detectedFormat?: DateFormat;
  error?: {
    code: DateValidationErrorCode;
    message: string;
  };
}

/**
 * Date parsing options
 */
export interface DateParseOptions {
  allowFuture?: boolean;
  minDate?: Date | string; // Minimum allowed date
  maxDate?: Date | string; // Maximum allowed date
}

/**
 * Default minimum date (2020-01-01)
 */
export const DEFAULT_MIN_DATE = new Date('2020-01-01');

/**
 * Detect date format from string
 * 
 * @param dateStr - Date string to analyze
 * @returns Detected format or null if unknown
 */
export function detectDateFormat(dateStr: string): DateFormat | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return DateFormat.ISO;
  }

  // European format: DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    return DateFormat.EUROPEAN;
  }

  // US/International format: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return DateFormat.US;
  }

  return null;
}

/**
 * Parse date string to Date object
 * 
 * @param dateStr - Date string in any supported format
 * @returns Date object or null if parsing fails
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  const format = detectDateFormat(trimmed);

  if (!format) return null;

  try {
    let year: number;
    let month: number;
    let day: number;

    switch (format) {
      case DateFormat.ISO: {
        // YYYY-MM-DD
        const parts = trimmed.split('-').map(Number);
        if (parts.length !== 3) return null;
        [year, month, day] = parts as [number, number, number];
        break;
      }

      case DateFormat.EUROPEAN: {
        // DD.MM.YYYY
        const parts = trimmed.split('.').map(Number);
        if (parts.length !== 3) return null;
        [day, month, year] = parts as [number, number, number];
        break;
      }

      case DateFormat.US: {
        // DD/MM/YYYY
        const parts = trimmed.split('/').map(Number);
        if (parts.length !== 3) return null;
        [day, month, year] = parts as [number, number, number];
        break;
      }

      default:
        return null;
    }

    // Create date (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);

    // Validate that the date is valid and matches input
    // (e.g., 2024-02-30 would roll over to March, which we don't want)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 * 
 * @param date - Date object to format
 * @returns ISO date string
 */
export function formatToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Validate date against business rules
 * 
 * @param date - Date to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateDateRules(
  date: Date,
  options: DateParseOptions = {}
): DateValidationResult {
  const {
    allowFuture = false,
    minDate = DEFAULT_MIN_DATE,
    maxDate = allowFuture ? undefined : new Date(),
  } = options;

  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today

  // Check if date is in the future
  if (!allowFuture && date > now) {
    return {
      valid: false,
      error: {
        code: DateValidationErrorCode.FUTURE_DATE,
        message: 'Date cannot be in the future',
      },
    };
  }

  // Check minimum date
  const minDateObj = typeof minDate === 'string' ? new Date(minDate) : minDate;
  if (date < minDateObj) {
    return {
      valid: false,
      error: {
        code: DateValidationErrorCode.TOO_OLD,
        message: `Date must be after ${formatToISO(minDateObj)}`,
      },
    };
  }

  // Check maximum date (if provided)
  if (maxDate) {
    const maxDateObj = typeof maxDate === 'string' ? new Date(maxDate) : maxDate;
    if (date > maxDateObj) {
      return {
        valid: false,
        error: {
          code: DateValidationErrorCode.FUTURE_DATE,
          message: `Date must be before ${formatToISO(maxDateObj)}`,
        },
      };
    }
  }

  return {
    valid: true,
    parsedDate: date,
    normalizedDate: formatToISO(date),
  };
}

/**
 * Parse and validate date string with business rules
 * 
 * @param dateStr - Date string in any supported format
 * @param options - Parsing and validation options
 * @returns Validation result with normalized date
 */
export function parseAndValidateDate(
  dateStr: string,
  options: DateParseOptions = {}
): DateValidationResult {
  // Detect format
  const format = detectDateFormat(dateStr);
  if (!format) {
    return {
      valid: false,
      error: {
        code: DateValidationErrorCode.INVALID_FORMAT,
        message: `Invalid date format. Expected: ${DateFormat.ISO}, ${DateFormat.EUROPEAN}, or ${DateFormat.US}`,
      },
    };
  }

  // Parse date
  const date = parseDate(dateStr);
  if (!date) {
    return {
      valid: false,
      detectedFormat: format,
      error: {
        code: DateValidationErrorCode.INVALID_DATE,
        message: 'Invalid date value',
      },
    };
  }

  // Validate business rules
  const validationResult = validateDateRules(date, options);
  if (!validationResult.valid) {
    return {
      ...validationResult,
      detectedFormat: format,
    };
  }

  return {
    valid: true,
    normalizedDate: formatToISO(date),
    parsedDate: date,
    detectedFormat: format,
  };
}

/**
 * Batch parse and validate multiple dates
 * 
 * @param dates - Array of date strings
 * @param options - Parsing and validation options
 * @returns Array of validation results
 */
export function parseAndValidateDates(
  dates: string[],
  options: DateParseOptions = {}
): DateValidationResult[] {
  return dates.map((dateStr) => parseAndValidateDate(dateStr, options));
}

/**
 * Check if a date string is valid
 * 
 * @param dateStr - Date string to check
 * @returns True if valid, false otherwise
 */
export function isValidDate(dateStr: string): boolean {
  const result = parseAndValidateDate(dateStr);
  return result.valid;
}

/**
 * Normalize date string to ISO format
 * 
 * @param dateStr - Date string in any supported format
 * @returns ISO date string or null if parsing fails
 */
export function normalizeDate(dateStr: string): string | null {
  const result = parseAndValidateDate(dateStr, {
    allowFuture: true,
    minDate: new Date('1900-01-01'), // Allow very old dates for normalization
  });
  return result.normalizedDate || null;
}
