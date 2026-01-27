import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { csvService } from '../../src/services/csv.service';

const FIXTURES_DIR = path.join(__dirname, '../fixtures');
const TEST_FILES_DIR = path.join(__dirname, '../test-validation-files');

describe('Row-Level Validation Integration', () => {
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(TEST_FILES_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(TEST_FILES_DIR);
      for (const file of files) {
        await fs.unlink(path.join(TEST_FILES_DIR, file));
      }
      await fs.rmdir(TEST_FILES_DIR);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Valid CSV with Valid Data', () => {
    it('should validate all rows successfully with valid transactions', async () => {
      // Create CSV with valid data
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,1500.00,Salary,Monthly payment',
        '2024-01-16,-50.00,Groceries,Weekly shopping',
        '15.01.2024,100.50,Transport,Taxi fare',
        '16/01/2024,-25.75,Food,Lunch',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'valid-transactions.csv');
      await fs.writeFile(testFile, csvContent);

      // Parse CSV
      const parsed = await csvService.parseFile(testFile);
      expect(parsed.totalRows).toBe(4);

      // Validate rows
      const validationResults = csvService.validateRows(parsed);
      
      expect(validationResults).toHaveLength(4);
      expect(validationResults.every((r) => r.valid)).toBe(true);
      
      // Check validated data structure
      expect(validationResults[0]?.data).toBeDefined();
      expect(validationResults[0]?.data?.date).toBe('2024-01-15');
      expect(validationResults[0]?.data?.amount).toBe(1500.00);
      expect(validationResults[0]?.data?.category).toBe('Salary');

      // Check validation stats
      const stats = csvService.getValidationStats(validationResults);
      expect(stats.total).toBe(4);
      expect(stats.valid).toBe(4);
      expect(stats.invalid).toBe(0);
      expect(stats.successRate).toBe(100);
    });
  });

  describe('CSV with Invalid Data', () => {
    it('should detect invalid date formats', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Valid',
        '01-15-2024,50.00,Transport,Invalid date format',
        'not-a-date,75.00,Other,Invalid date',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'invalid-dates.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults).toHaveLength(3);
      expect(validationResults[0]?.valid).toBe(true);
      expect(validationResults[1]?.valid).toBe(false);
      expect(validationResults[2]?.valid).toBe(false);

      // Check error details for row 2
      expect(validationResults[1]?.errors).toBeDefined();
      const dateError = validationResults[1]?.errors?.find(
        (e) => e.path[0] === 'date'
      );
      expect(dateError).toBeDefined();
      expect(dateError?.message).toContain('Date must be in format');

      // Check stats
      const stats = csvService.getValidationStats(validationResults);
      expect(stats.valid).toBe(1);
      expect(stats.invalid).toBe(2);
      expect(stats.successRate).toBe(33.33);
      expect(stats.errorsByField['date']).toBeGreaterThanOrEqual(2); // May have multiple errors per row
    });

    it('should detect invalid amounts', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Valid',
        '2024-01-16,0.001,Transport,Too small',
        '2024-01-17,2000000,Shopping,Too large',
        '2024-01-18,abc,Other,Not a number',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'invalid-amounts.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults).toHaveLength(4);
      expect(validationResults[0]?.valid).toBe(true);
      expect(validationResults[1]?.valid).toBe(false); // Too small
      expect(validationResults[2]?.valid).toBe(false); // Too large
      expect(validationResults[3]?.valid).toBe(false); // Not a number

      // Check error details
      const stats = csvService.getValidationStats(validationResults);
      expect(stats.errorsByField['amount']).toBe(3);
    });

    it('should detect invalid categories', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Valid',
        '2024-01-16,50.00,,Empty category',
        `2024-01-17,75.00,${'a'.repeat(101)},Category too long`,
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'invalid-categories.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults).toHaveLength(3);
      expect(validationResults[0]?.valid).toBe(true);
      expect(validationResults[1]?.valid).toBe(false); // Empty
      expect(validationResults[2]?.valid).toBe(false); // Too long

      const stats = csvService.getValidationStats(validationResults);
      expect(stats.errorsByField['category']).toBeGreaterThanOrEqual(2); // May have multiple errors per row
    });

    it('should detect invalid descriptions', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Valid description',
        `2024-01-16,50.00,Transport,${'a'.repeat(501)}`,
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'invalid-descriptions.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults).toHaveLength(2);
      expect(validationResults[0]?.valid).toBe(true);
      expect(validationResults[1]?.valid).toBe(false);

      const descError = validationResults[1]?.errors?.find(
        (e) => e.path[0] === 'description'
      );
      expect(descError?.message).toContain('500');
    });

    it('should handle multiple validation errors per row', async () => {
      const csvContent = [
        'date,amount,category,description',
        'invalid-date,abc,,Too many errors',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'multiple-errors.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults).toHaveLength(1);
      expect(validationResults[0]?.valid).toBe(false);
      expect(validationResults[0]?.errors?.length).toBeGreaterThanOrEqual(3);

      // Should have errors for date, amount, and category
      const errorFields = validationResults[0]?.errors?.map((e) => e.path[0]);
      expect(errorFields).toContain('date');
      expect(errorFields).toContain('amount');
      expect(errorFields).toContain('category');
    });
  });

  describe('Mixed Valid and Invalid Rows', () => {
    it('should validate mixed data correctly', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Valid row 1',
        'invalid-date,50.00,Transport,Invalid date',
        '2024-01-17,0.001,Shopping,Invalid amount',
        '2024-01-18,75.00,Entertainment,Valid row 2',
        '2024-01-19,abc,,Multiple errors',
        '2024-01-20,200.00,Bills,Valid row 3',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'mixed-data.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults).toHaveLength(6);

      // Check individual rows
      expect(validationResults[0]?.valid).toBe(true);  // Row 1: valid
      expect(validationResults[1]?.valid).toBe(false); // Row 2: invalid date
      expect(validationResults[2]?.valid).toBe(false); // Row 3: invalid amount
      expect(validationResults[3]?.valid).toBe(true);  // Row 4: valid
      expect(validationResults[4]?.valid).toBe(false); // Row 5: multiple errors
      expect(validationResults[5]?.valid).toBe(true);  // Row 6: valid

      // Check stats
      const stats = csvService.getValidationStats(validationResults);
      expect(stats.total).toBe(6);
      expect(stats.valid).toBe(3);
      expect(stats.invalid).toBe(3);
      expect(stats.successRate).toBe(50);

      // Check common errors
      expect(stats.commonErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Statistics', () => {
    it('should generate detailed validation statistics', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Valid',
        'invalid-date,50.00,Transport,Error 1',
        'also-invalid,75.00,Shopping,Error 2',
        '2024-01-18,0.001,Bills,Error 3',
        '2024-01-19,abc,Other,Error 4',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'stats-test.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);
      const stats = csvService.getValidationStats(validationResults);

      // Basic stats
      expect(stats.total).toBe(5);
      expect(stats.valid).toBe(1);
      expect(stats.invalid).toBe(4);
      expect(stats.successRate).toBe(20);

      // Errors by field
      expect(stats.errorsByField).toBeDefined();
      expect(stats.errorsByField['date']).toBeGreaterThan(0);
      expect(stats.errorsByField['amount']).toBeGreaterThan(0);

      // Common errors
      expect(stats.commonErrors).toBeDefined();
      expect(stats.commonErrors.length).toBeGreaterThan(0);
      expect(stats.commonErrors[0]).toHaveProperty('field');
      expect(stats.commonErrors[0]).toHaveProperty('count');
      expect(stats.commonErrors[0]).toHaveProperty('message');
    });

    it('should handle all valid rows in stats', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Row 1',
        '2024-01-16,50.00,Transport,Row 2',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'all-valid.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);
      const stats = csvService.getValidationStats(validationResults);

      expect(stats.successRate).toBe(100);
      expect(stats.invalid).toBe(0);
      expect(stats.commonErrors).toHaveLength(0);
      expect(Object.keys(stats.errorsByField)).toHaveLength(0);
    });
  });

  describe('Row Numbering', () => {
    it('should use 1-based row numbering', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,100.00,Food,Row 1',
        'invalid,50.00,Transport,Row 2',
        '2024-01-17,75.00,Shopping,Row 3',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'row-numbering.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      // Check row numbers are 1-based
      expect(validationResults[0]?.row).toBe(1);
      expect(validationResults[1]?.row).toBe(2);
      expect(validationResults[2]?.row).toBe(3);

      // Invalid row should be row 2
      expect(validationResults[1]?.valid).toBe(false);
      expect(validationResults[1]?.row).toBe(2);
    });
  });

  describe('Raw Data Preservation', () => {
    it('should preserve raw CSV data in validation results', async () => {
      const csvContent = [
        'date,amount,category,description',
        '2024-01-15,1500.00,Salary,Payment',
      ].join('\n');

      const testFile = path.join(TEST_FILES_DIR, 'raw-data.csv');
      await fs.writeFile(testFile, csvContent);

      const parsed = await csvService.parseFile(testFile);
      const validationResults = csvService.validateRows(parsed);

      expect(validationResults[0]?.rawData).toBeDefined();
      expect(validationResults[0]?.rawData.date).toBe('2024-01-15');
      expect(validationResults[0]?.rawData.amount).toBe('1500.00');
      expect(validationResults[0]?.rawData.category).toBe('Salary');

      // Validated data should be transformed
      expect(validationResults[0]?.data?.amount).toBe(1500.00); // Converted to number
    });
  });
});
