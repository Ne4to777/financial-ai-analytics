import { describe, it, expect } from 'vitest';
import {
  DateSchema,
  AmountSchema,
  CategorySchema,
  DescriptionSchema,
  TransactionSchema,
  validateTransaction,
  validateTransactions,
  getValidationStats,
} from '../../src/validators/schema.validator';

describe('Schema Validator', () => {
  describe('DateSchema', () => {
    it('should accept valid ISO date (YYYY-MM-DD)', () => {
      const result = DateSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
    });

    it('should accept valid European date (DD.MM.YYYY)', () => {
      const result = DateSchema.safeParse('15.01.2024');
      expect(result.success).toBe(true);
    });

    it('should accept valid US/international date (DD/MM/YYYY)', () => {
      const result = DateSchema.safeParse('15/01/2024');
      expect(result.success).toBe(true);
    });

    it('should reject empty date', () => {
      const result = DateSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('required');
      }
    });

    it('should reject invalid date format', () => {
      const result = DateSchema.safeParse('2024/01/15'); // Wrong separator
      expect(result.success).toBe(false);
    });

    it('should reject invalid date value', () => {
      const result = DateSchema.safeParse('2024-13-45'); // Invalid month/day
      expect(result.success).toBe(false);
    });

    it('should reject non-date string', () => {
      const result = DateSchema.safeParse('not a date');
      expect(result.success).toBe(false);
    });
  });

  describe('AmountSchema', () => {
    it('should accept valid positive number', () => {
      const result = AmountSchema.safeParse(1500.00);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1500.00);
      }
    });

    it('should accept valid negative number', () => {
      const result = AmountSchema.safeParse(-50.00);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(-50.00);
      }
    });

    it('should accept string number', () => {
      const result = AmountSchema.safeParse('1500.00');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1500.00);
      }
    });

    it('should accept string with currency symbol', () => {
      const result = AmountSchema.safeParse('$1,500.00');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1500.00);
      }
    });

    it('should accept string with Euro symbol', () => {
      const result = AmountSchema.safeParse('€1.500,00'); // European format
      expect(result.success).toBe(true);
    });

    it('should reject amount below minimum (< 0.01)', () => {
      const result = AmountSchema.safeParse(0.001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('0.01');
      }
    });

    it('should reject amount above maximum (> 1,000,000)', () => {
      const result = AmountSchema.safeParse(1000001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('1,000,000');
      }
    });

    it('should reject non-numeric string', () => {
      const result = AmountSchema.safeParse('abc');
      expect(result.success).toBe(false);
    });

    it('should reject infinity', () => {
      const result = AmountSchema.safeParse(Infinity);
      expect(result.success).toBe(false);
      // Zod returns "Invalid input" for Infinity in transform
    });

    it('should accept minimum valid amount', () => {
      const result = AmountSchema.safeParse(0.01);
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid amount', () => {
      const result = AmountSchema.safeParse(1000000);
      expect(result.success).toBe(true);
    });
  });

  describe('CategorySchema', () => {
    it('should accept valid category', () => {
      const result = CategorySchema.safeParse('Salary');
      expect(result.success).toBe(true);
    });

    it('should accept category with spaces', () => {
      const result = CategorySchema.safeParse('Weekly Groceries');
      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = CategorySchema.safeParse('  Salary  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Salary');
      }
    });

    it('should reject empty category', () => {
      const result = CategorySchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('required');
      }
    });

    it('should reject whitespace-only category', () => {
      const result = CategorySchema.safeParse('   ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('empty');
      }
    });

    it('should reject category exceeding 100 characters', () => {
      const longCategory = 'a'.repeat(101);
      const result = CategorySchema.safeParse(longCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('100');
      }
    });

    it('should accept category with exactly 100 characters', () => {
      const category = 'a'.repeat(100);
      const result = CategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    });
  });

  describe('DescriptionSchema', () => {
    it('should accept valid description', () => {
      const result = DescriptionSchema.safeParse('Monthly salary payment');
      expect(result.success).toBe(true);
    });

    it('should accept empty string as undefined', () => {
      const result = DescriptionSchema.safeParse('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should accept undefined', () => {
      const result = DescriptionSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should trim whitespace', () => {
      const result = DescriptionSchema.safeParse('  Description  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Description');
      }
    });

    it('should reject description exceeding 500 characters', () => {
      const longDesc = 'a'.repeat(501);
      const result = DescriptionSchema.safeParse(longDesc);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('500');
      }
    });

    it('should accept description with exactly 500 characters', () => {
      const desc = 'a'.repeat(500);
      const result = DescriptionSchema.safeParse(desc);
      expect(result.success).toBe(true);
    });
  });

  describe('TransactionSchema', () => {
    it('should validate complete valid transaction', () => {
      const transaction = {
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
        description: 'Monthly salary payment',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe('2024-01-15');
        expect(result.data.amount).toBe(1500.00);
        expect(result.data.category).toBe('Salary');
        expect(result.data.description).toBe('Monthly salary payment');
      }
    });

    it('should validate transaction without description', () => {
      const transaction = {
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(true);
    });

    it('should validate transaction with negative amount', () => {
      const transaction = {
        date: '2024-01-16',
        amount: '-50.00',
        category: 'Groceries',
        description: 'Weekly shopping',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(-50.00);
      }
    });

    it('should reject transaction with missing date', () => {
      const transaction = {
        amount: '1500.00',
        category: 'Salary',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(false);
    });

    it('should reject transaction with invalid date', () => {
      const transaction = {
        date: 'invalid',
        amount: '1500.00',
        category: 'Salary',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(false);
    });

    it('should reject transaction with missing amount', () => {
      const transaction = {
        date: '2024-01-15',
        category: 'Salary',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(false);
    });

    it('should reject transaction with missing category', () => {
      const transaction = {
        date: '2024-01-15',
        amount: '1500.00',
      };

      const result = TransactionSchema.safeParse(transaction);
      expect(result.success).toBe(false);
    });
  });

  describe('validateTransaction', () => {
    it('should return success for valid transaction', () => {
      const transaction = {
        date: '2024-01-15',
        amount: '1500.00',
        category: 'Salary',
        description: 'Payment',
      };

      const result = validateTransaction(transaction);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid transaction', () => {
      const transaction = {
        date: 'invalid',
        amount: 'abc',
        category: '',
      };

      const result = validateTransaction(transaction);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.issues).toBeDefined();
      expect(result.error!.issues.length).toBeGreaterThan(0);
    });
  });

  describe('validateTransactions', () => {
    it('should validate multiple transactions', () => {
      const transactions = [
        { date: '2024-01-15', amount: '1500.00', category: 'Salary' },
        { date: '2024-01-16', amount: '-50.00', category: 'Groceries' },
        { date: 'invalid', amount: '100', category: 'Transport' },
      ];

      const results = validateTransactions(transactions);
      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.row).toBe(1);
      expect(results[1]?.success).toBe(true);
      expect(results[1]?.row).toBe(2);
      expect(results[2]?.success).toBe(false);
      expect(results[2]?.row).toBe(3);
    });
  });

  describe('getValidationStats', () => {
    it('should calculate statistics correctly', () => {
      const results = [
        { success: true, data: {} as any },
        { success: true, data: {} as any },
        { success: false, error: {} as any },
      ];

      const stats = getValidationStats(results);
      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(2);
      expect(stats.invalid).toBe(1);
      expect(stats.successRate).toBe(66.67);
    });

    it('should handle empty results', () => {
      const stats = getValidationStats([]);
      expect(stats.total).toBe(0);
      expect(stats.valid).toBe(0);
      expect(stats.invalid).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should handle all valid', () => {
      const results = [
        { success: true, data: {} as any },
        { success: true, data: {} as any },
      ];

      const stats = getValidationStats(results);
      expect(stats.successRate).toBe(100);
    });
  });
});
