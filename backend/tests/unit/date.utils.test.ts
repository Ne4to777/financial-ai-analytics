import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DateFormat,
  DateValidationErrorCode,
  detectDateFormat,
  parseDate,
  formatToISO,
  validateDateRules,
  parseAndValidateDate,
  parseAndValidateDates,
  isValidDate,
  normalizeDate,
  DEFAULT_MIN_DATE,
} from '../../src/utils/date.utils';

describe('Date Utils', () => {
  describe('detectDateFormat', () => {
    it('should detect ISO format (YYYY-MM-DD)', () => {
      expect(detectDateFormat('2024-01-15')).toBe(DateFormat.ISO);
      expect(detectDateFormat('2020-12-31')).toBe(DateFormat.ISO);
    });

    it('should detect European format (DD.MM.YYYY)', () => {
      expect(detectDateFormat('15.01.2024')).toBe(DateFormat.EUROPEAN);
      expect(detectDateFormat('31.12.2020')).toBe(DateFormat.EUROPEAN);
    });

    it('should detect US format (DD/MM/YYYY)', () => {
      expect(detectDateFormat('15/01/2024')).toBe(DateFormat.US);
      expect(detectDateFormat('31/12/2020')).toBe(DateFormat.US);
    });

    it('should return null for invalid formats', () => {
      expect(detectDateFormat('2024/01/15')).toBeNull(); // Wrong separators
      expect(detectDateFormat('01-15-2024')).toBeNull(); // MM-DD-YYYY
      expect(detectDateFormat('15-01-2024')).toBeNull(); // DD-MM-YYYY with wrong separator
      expect(detectDateFormat('not a date')).toBeNull();
      expect(detectDateFormat('')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(detectDateFormat('  2024-01-15  ')).toBe(DateFormat.ISO);
      expect(detectDateFormat('  15.01.2024  ')).toBe(DateFormat.EUROPEAN);
    });

    it('should return null for non-string input', () => {
      expect(detectDateFormat(null as any)).toBeNull();
      expect(detectDateFormat(undefined as any)).toBeNull();
      expect(detectDateFormat(123 as any)).toBeNull();
    });
  });

  describe('parseDate', () => {
    it('should parse ISO format correctly', () => {
      const date = parseDate('2024-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0); // January (0-indexed)
      expect(date?.getDate()).toBe(15);
    });

    it('should parse European format correctly', () => {
      const date = parseDate('15.01.2024');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should parse US format correctly', () => {
      const date = parseDate('15/01/2024');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should return null for invalid format', () => {
      expect(parseDate('2024/01/15')).toBeNull();
      expect(parseDate('not a date')).toBeNull();
      expect(parseDate('')).toBeNull();
    });

    it('should return null for invalid date values', () => {
      expect(parseDate('2024-13-01')).toBeNull(); // Invalid month
      expect(parseDate('2024-02-30')).toBeNull(); // February 30th
      expect(parseDate('2024-04-31')).toBeNull(); // April 31st
      expect(parseDate('32.01.2024')).toBeNull(); // Invalid day
      expect(parseDate('15.13.2024')).toBeNull(); // Invalid month
    });

    it('should handle leap years correctly', () => {
      expect(parseDate('2024-02-29')).toBeInstanceOf(Date); // 2024 is leap year
      expect(parseDate('2023-02-29')).toBeNull(); // 2023 is not leap year
      expect(parseDate('29.02.2024')).toBeInstanceOf(Date);
      expect(parseDate('29.02.2023')).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(parseDate('2020-01-01')).toBeInstanceOf(Date); // Min date
      expect(parseDate('2099-12-31')).toBeInstanceOf(Date); // Far future
    });
  });

  describe('formatToISO', () => {
    it('should format date to ISO string', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatToISO(date)).toBe('2024-01-15');
    });

    it('should pad single digits with zeros', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatToISO(date)).toBe('2024-01-05');
    });

    it('should handle different months', () => {
      expect(formatToISO(new Date(2024, 11, 31))).toBe('2024-12-31'); // December
      expect(formatToISO(new Date(2024, 0, 1))).toBe('2024-01-01'); // January
    });
  });

  describe('validateDateRules', () => {
    beforeEach(() => {
      // Mock current date to ensure consistent tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    it('should accept valid date in the past', () => {
      const date = new Date('2024-01-15');
      const result = validateDateRules(date);
      
      expect(result.valid).toBe(true);
      expect(result.normalizedDate).toBe('2024-01-15');
      expect(result.error).toBeUndefined();
    });

    it('should reject future date by default', () => {
      const date = new Date('2024-12-31');
      const result = validateDateRules(date);
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.FUTURE_DATE);
      expect(result.error?.message).toContain('future');
    });

    it('should accept future date when allowed', () => {
      const date = new Date('2024-12-31');
      const result = validateDateRules(date, { allowFuture: true });
      
      expect(result.valid).toBe(true);
    });

    it('should reject date before minimum date (2020-01-01)', () => {
      const date = new Date('2019-12-31');
      const result = validateDateRules(date);
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.TOO_OLD);
      expect(result.error?.message).toContain('2020-01-01');
    });

    it('should accept date equal to minimum date', () => {
      const date = new Date('2020-01-01');
      const result = validateDateRules(date);
      
      expect(result.valid).toBe(true);
    });

    it('should accept today\'s date', () => {
      const today = new Date('2024-06-15');
      const result = validateDateRules(today);
      
      expect(result.valid).toBe(true);
    });

    it('should respect custom minimum date', () => {
      const date = new Date('2023-01-01');
      const result = validateDateRules(date, { minDate: new Date('2023-06-01') });
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.TOO_OLD);
    });

    it('should respect custom maximum date', () => {
      const date = new Date('2024-02-01');
      const result = validateDateRules(date, { maxDate: new Date('2024-01-31') });
      
      expect(result.valid).toBe(false);
    });

    it('should accept date string as minDate/maxDate', () => {
      const date = new Date('2023-06-15');
      const result = validateDateRules(date, {
        minDate: '2023-01-01',
        maxDate: '2023-12-31',
      });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('parseAndValidateDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    it('should parse and validate valid ISO date', () => {
      const result = parseAndValidateDate('2024-01-15');
      
      expect(result.valid).toBe(true);
      expect(result.normalizedDate).toBe('2024-01-15');
      expect(result.detectedFormat).toBe(DateFormat.ISO);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });

    it('should parse and validate valid European date', () => {
      const result = parseAndValidateDate('15.01.2024');
      
      expect(result.valid).toBe(true);
      expect(result.normalizedDate).toBe('2024-01-15');
      expect(result.detectedFormat).toBe(DateFormat.EUROPEAN);
    });

    it('should parse and validate valid US date', () => {
      const result = parseAndValidateDate('15/01/2024');
      
      expect(result.valid).toBe(true);
      expect(result.normalizedDate).toBe('2024-01-15');
      expect(result.detectedFormat).toBe(DateFormat.US);
    });

    it('should reject invalid format', () => {
      const result = parseAndValidateDate('01-15-2024');
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.INVALID_FORMAT);
      expect(result.detectedFormat).toBeUndefined();
    });

    it('should reject invalid date value', () => {
      const result = parseAndValidateDate('2024-02-30');
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.INVALID_DATE);
      expect(result.detectedFormat).toBe(DateFormat.ISO);
    });

    it('should reject future date', () => {
      const result = parseAndValidateDate('2024-12-31');
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.FUTURE_DATE);
    });

    it('should reject date before minimum', () => {
      const result = parseAndValidateDate('2019-06-15');
      
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(DateValidationErrorCode.TOO_OLD);
    });

    it('should accept future date when allowed', () => {
      const result = parseAndValidateDate('2025-01-01', { allowFuture: true });
      
      expect(result.valid).toBe(true);
      expect(result.normalizedDate).toBe('2025-01-01');
    });

    it('should respect custom options', () => {
      const result = parseAndValidateDate('2022-06-15', {
        minDate: '2021-01-01',
        maxDate: '2023-12-31',
      });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('parseAndValidateDates', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    it('should validate multiple dates', () => {
      const dates = [
        '2024-01-15',
        '15.02.2024',
        '15/03/2024',
      ];
      
      const results = parseAndValidateDates(dates);
      
      expect(results).toHaveLength(3);
      expect(results[0]?.valid).toBe(true);
      expect(results[0]?.normalizedDate).toBe('2024-01-15');
      expect(results[1]?.valid).toBe(true);
      expect(results[1]?.normalizedDate).toBe('2024-02-15');
      expect(results[2]?.valid).toBe(true);
      expect(results[2]?.normalizedDate).toBe('2024-03-15');
    });

    it('should handle mixed valid and invalid dates', () => {
      const dates = [
        '2024-01-15', // valid
        'invalid',    // invalid format
        '2024-02-30', // invalid date
        '2025-01-01', // future
      ];
      
      const results = parseAndValidateDates(dates);
      
      expect(results).toHaveLength(4);
      expect(results[0]?.valid).toBe(true);
      expect(results[1]?.valid).toBe(false);
      expect(results[2]?.valid).toBe(false);
      expect(results[3]?.valid).toBe(false);
    });

    it('should apply options to all dates', () => {
      const dates = ['2025-01-01', '2025-06-15'];
      const results = parseAndValidateDates(dates, { allowFuture: true });
      
      expect(results[0]?.valid).toBe(true);
      expect(results[1]?.valid).toBe(true);
    });
  });

  describe('isValidDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    it('should return true for valid dates', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('15.01.2024')).toBe(true);
      expect(isValidDate('15/01/2024')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-02-30')).toBe(false);
      expect(isValidDate('2025-01-01')).toBe(false); // future
      expect(isValidDate('2019-01-01')).toBe(false); // too old
    });
  });

  describe('normalizeDate', () => {
    it('should normalize valid dates to ISO format', () => {
      expect(normalizeDate('2024-01-15')).toBe('2024-01-15');
      expect(normalizeDate('15.01.2024')).toBe('2024-01-15');
      expect(normalizeDate('15/01/2024')).toBe('2024-01-15');
    });

    it('should return null for invalid dates', () => {
      expect(normalizeDate('invalid')).toBeNull();
      expect(normalizeDate('2024-02-30')).toBeNull();
      expect(normalizeDate('')).toBeNull();
    });

    it('should allow future dates for normalization', () => {
      expect(normalizeDate('2099-12-31')).toBe('2099-12-31');
    });

    it('should allow old dates for normalization', () => {
      expect(normalizeDate('1990-01-01')).toBe('1990-01-01');
    });
  });

  describe('DEFAULT_MIN_DATE', () => {
    it('should be set to 2020-01-01', () => {
      expect(DEFAULT_MIN_DATE.getFullYear()).toBe(2020);
      expect(DEFAULT_MIN_DATE.getMonth()).toBe(0);
      expect(DEFAULT_MIN_DATE.getDate()).toBe(1);
    });
  });
});
