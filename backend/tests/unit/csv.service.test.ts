import { describe, it, expect } from 'vitest';
import path from 'path';
import { Readable } from 'stream';
import {
  CSVService,
  CSVError,
  CSVErrorCode,
} from '../../src/services/csv.service';

const FIXTURES_DIR = path.join(__dirname, '../fixtures');

describe('CSVService', () => {
  const csvService = new CSVService();

  describe('parseFile', () => {
    it('should parse valid CSV file', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid.csv');
      const result = await csvService.parseFile(filePath);

      expect(result.columns).toEqual(['date', 'amount', 'category', 'description']);
      expect(result.totalRows).toBe(5);
      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toEqual({
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
        description: 'Monthly salary payment',
      });
      expect(result.meta.delimiter).toBe(',');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(FIXTURES_DIR, 'nonexistent.csv');

      await expect(csvService.parseFile(filePath)).rejects.toThrow(CSVError);
      await expect(csvService.parseFile(filePath)).rejects.toMatchObject({
        code: CSVErrorCode.FILE_READ_ERROR,
        message: expect.stringContaining('not found'),
      });
    });

    it('should throw error for empty file', async () => {
      const filePath = path.join(FIXTURES_DIR, 'empty.csv');

      await expect(csvService.parseFile(filePath)).rejects.toThrow(CSVError);
      await expect(csvService.parseFile(filePath)).rejects.toMatchObject({
        code: CSVErrorCode.EMPTY_FILE,
      });
    });

    it('should throw error for CSV with no data rows', async () => {
      const filePath = path.join(FIXTURES_DIR, 'no-data.csv');

      await expect(csvService.parseFile(filePath)).rejects.toThrow(CSVError);
      await expect(csvService.parseFile(filePath)).rejects.toMatchObject({
        code: CSVErrorCode.EMPTY_FILE,
        message: expect.stringContaining('no data rows'),
      });
    });

    it('should handle CSV with empty lines', async () => {
      const filePath = path.join(FIXTURES_DIR, 'with-empty-lines.csv');
      const result = await csvService.parseFile(filePath);

      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.date).toBe('2024-01-15');
      expect(result.rows[1]?.date).toBe('2024-01-16');
    });

    it('should trim header spaces when configured', async () => {
      const filePath = path.join(FIXTURES_DIR, 'with-spaces.csv');
      const result = await csvService.parseFile(filePath, { trimHeaders: true });

      expect(result.columns).toEqual(['date', 'amount', 'category', 'description']);
      expect(result.columns[0]).toBe('date'); // No leading/trailing spaces
    });

    it('should throw error for malformed CSV', async () => {
      const filePath = path.join(FIXTURES_DIR, 'malformed.csv');

      await expect(csvService.parseFile(filePath)).rejects.toThrow(CSVError);
      await expect(csvService.parseFile(filePath)).rejects.toMatchObject({
        code: CSVErrorCode.PARSE_ERROR,
      });
    });
  });

  describe('parseString', () => {
    it('should parse valid CSV string', () => {
      const csvContent = `date,amount,category
2024-01-15,1500.00,Salary
2024-01-16,-50.00,Groceries`;

      const result = csvService.parseString(csvContent);

      expect(result.columns).toEqual(['date', 'amount', 'category']);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0]).toEqual({
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
      });
    });

    it('should handle CSV with quoted fields', () => {
      const csvContent = `date,amount,description
2024-01-15,1500.00,"Contains, comma"
2024-01-16,-50.00,"Normal text"`;

      const result = csvService.parseString(csvContent);

      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.description).toBe('Contains, comma');
      expect(result.rows[1]?.description).toBe('Normal text');
    });

    it('should handle CSV with empty values', () => {
      const csvContent = `date,amount,category,description
2024-01-15,1500.00,Salary,
2024-01-16,,Groceries,Shopping`;

      const result = csvService.parseString(csvContent);

      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.description).toBe('');
      expect(result.rows[1]?.amount).toBe('');
    });

    it('should handle different line endings', () => {
      const csvContent = "date,amount\r\n2024-01-15,1500.00\r\n2024-01-16,-50.00";

      const result = csvService.parseString(csvContent);

      expect(result.totalRows).toBe(2);
      expect(result.meta.linebreak).toBe('\r\n');
    });

    it('should throw error for empty string', () => {
      expect(() => csvService.parseString('')).toThrow(CSVError);
      expect(() => csvService.parseString('')).toThrow(
        expect.objectContaining({
          code: CSVErrorCode.EMPTY_FILE,
        })
      );
    });

    it('should skip empty lines when configured', () => {
      const csvContent = `date,amount\n\n2024-01-15,1500.00\n\n\n2024-01-16,-50.00\n\n`;

      const result = csvService.parseString(csvContent, { skipEmptyLines: 'greedy' });

      expect(result.totalRows).toBe(2);
    });
  });

  describe('parseStream', () => {
    it('should parse CSV from readable stream', async () => {
      const csvContent = `date,amount,category
2024-01-15,1500.00,Salary
2024-01-16,-50.00,Groceries`;

      const stream = Readable.from([csvContent]);
      const result = await csvService.parseStream(stream);

      expect(result.columns).toEqual(['date', 'amount', 'category']);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.date).toBe('2024-01-15');
    });

    it('should handle chunked stream', async () => {
      const chunks = [
        'date,amount\n',
        '2024-01-15,1500.00\n',
        '2024-01-16,-50.00',
      ];

      const stream = Readable.from(chunks);
      const result = await csvService.parseStream(stream);

      expect(result.totalRows).toBe(2);
    });

    it('should throw error for empty stream', async () => {
      const stream = Readable.from([]);

      await expect(csvService.parseStream(stream)).rejects.toThrow(CSVError);
      await expect(csvService.parseStream(stream)).rejects.toMatchObject({
        code: CSVErrorCode.EMPTY_FILE,
      });
    });
  });

  describe('validateColumns', () => {
    it('should validate required columns exist', () => {
      const csvContent = `date,amount,category,description
2024-01-15,1500.00,Salary,Payment`;

      const parsed = csvService.parseString(csvContent);
      const validation = csvService.validateColumns(parsed, ['date', 'amount', 'category']);

      expect(validation.valid).toBe(true);
      expect(validation.missingColumns).toEqual([]);
      expect(validation.extraColumns).toEqual(['description']);
    });

    it('should detect missing columns', () => {
      const csvContent = `date,amount
2024-01-15,1500.00`;

      const parsed = csvService.parseString(csvContent);
      const validation = csvService.validateColumns(parsed, ['date', 'amount', 'category']);

      expect(validation.valid).toBe(false);
      expect(validation.missingColumns).toEqual(['category']);
      expect(validation.extraColumns).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const csvContent = `DATE,AMOUNT,CATEGORY
2024-01-15,1500.00,Salary`;

      const parsed = csvService.parseString(csvContent);
      const validation = csvService.validateColumns(parsed, ['date', 'amount', 'category']);

      expect(validation.valid).toBe(true);
      expect(validation.missingColumns).toEqual([]);
    });

    it('should handle extra columns', () => {
      const csvContent = `date,amount,category,extra1,extra2
2024-01-15,1500.00,Salary,foo,bar`;

      const parsed = csvService.parseString(csvContent);
      const validation = csvService.validateColumns(parsed, ['date', 'amount']);

      expect(validation.valid).toBe(true);
      expect(validation.extraColumns).toEqual(['category', 'extra1', 'extra2']);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const csvContent = `date,amount,category,description
2024-01-15,1500.00,Salary,Payment
2024-01-16,,Groceries,
2024-01-17,-25.50,Transport,Taxi`;

      const parsed = csvService.parseString(csvContent);
      const stats = csvService.getStats(parsed);

      expect(stats.totalRows).toBe(3);
      expect(stats.totalColumns).toBe(4);
      expect(stats.emptyValues).toBe(2); // One empty amount, one empty description
      expect(stats.parsingErrors).toBe(0);
    });

    it('should count empty and whitespace values', () => {
      const csvContent = `col1,col2,col3
value1,,value3
,,
value4,  ,value6`;

      const parsed = csvService.parseString(csvContent);
      const stats = csvService.getStats(parsed);

      expect(stats.emptyValues).toBeGreaterThan(0);
    });

    it('should throw error for mismatched fields', () => {
      const csvContent = `date,amount,category
2024-01-15,1500.00,Salary
2024-01-16,-50.00`; // Missing field

      // Papa Parse throws error for field mismatch
      expect(() => csvService.parseString(csvContent)).toThrow(CSVError);
      expect(() => csvService.parseString(csvContent)).toThrow(
        expect.objectContaining({
          code: CSVErrorCode.PARSE_ERROR,
        })
      );
    });
  });

  describe('Configuration options', () => {
    it('should respect header: false option', () => {
      const csvContent = `2024-01-15,1500.00,Salary
2024-01-16,-50.00,Groceries`;

      const result = csvService.parseString(csvContent, { header: false });

      // Without headers, Papa Parse uses array indices as keys
      expect(result.rows[0]).toHaveProperty('0', '2024-01-15');
      expect(result.rows[0]).toHaveProperty('1', '1500.00');
    });

    it('should handle dynamicTyping option', () => {
      const csvContent = `date,amount,active
2024-01-15,1500.00,true
2024-01-16,-50.00,false`;

      const result = csvService.parseString(csvContent, { dynamicTyping: true });

      // With dynamicTyping, numbers and booleans are converted
      expect(typeof result.rows[0]?.amount).toBe('number');
      expect(result.rows[0]?.amount).toBe(1500.00);
      expect(typeof result.rows[0]?.active).toBe('boolean');
      expect(result.rows[0]?.active).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle single row CSV', () => {
      const csvContent = `date,amount
2024-01-15,1500.00`;

      const result = csvService.parseString(csvContent);

      expect(result.totalRows).toBe(1);
      expect(result.rows).toHaveLength(1);
    });

    it('should handle CSV with many columns', () => {
      const columns = Array.from({ length: 50 }, (_, i) => `col${i}`).join(',');
      const values = Array.from({ length: 50 }, (_, i) => `val${i}`).join(',');
      const csvContent = `${columns}\n${values}`;

      const result = csvService.parseString(csvContent);

      expect(result.columns.length).toBe(50);
      expect(result.rows[0]).toHaveProperty('col0', 'val0');
      expect(result.rows[0]).toHaveProperty('col49', 'val49');
    });

    it('should handle unicode characters', () => {
      const csvContent = `name,description
Тест,Описание на русском
测试,中文描述`;

      const result = csvService.parseString(csvContent);

      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.name).toBe('Тест');
      expect(result.rows[1]?.name).toBe('测试');
    });
  });
});
