import { describe, it, expect } from 'vitest';
import { StatsService } from '../../src/services/stats.service';
import type { RowValidationResult, ValidatedTransaction } from '../../src/types/upload.types';

// Helper to create valid row
function createValidRow(row: number, transaction: ValidatedTransaction): RowValidationResult {
  return {
    row,
    valid: true,
    data: transaction,
    rawData: transaction as any,
  };
}

// Helper to create invalid row
function createInvalidRow(row: number): RowValidationResult {
  return {
    row,
    valid: false,
    errors: [{ path: ['date'], message: 'Invalid', code: 'invalid' }],
    rawData: {},
  };
}

describe('StatsService', () => {
  const service = new StatsService();

  describe('Date Range Statistics', () => {
    it('should calculate date range for valid transactions', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 200, category: 'Transport' }),
        createValidRow(3, { date: '2024-01-31', amount: 300, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.dateRange.earliest).toBe('2024-01-01');
      expect(stats.dateRange.latest).toBe('2024-01-31');
      expect(stats.dateRange.spanDays).toBe(30);
    });

    it('should handle single transaction date range', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.dateRange.earliest).toBe('2024-01-15');
      expect(stats.dateRange.latest).toBe('2024-01-15');
      expect(stats.dateRange.spanDays).toBe(0);
    });

    it('should return null for empty transactions', () => {
      const stats = service.calculateStatistics([]);

      expect(stats.dateRange.earliest).toBeNull();
      expect(stats.dateRange.latest).toBeNull();
      expect(stats.dateRange.spanDays).toBe(0);
    });

    it('should sort dates correctly regardless of input order', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-31', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-01', amount: 200, category: 'Transport' }),
        createValidRow(3, { date: '2024-01-15', amount: 300, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.dateRange.earliest).toBe('2024-01-01');
      expect(stats.dateRange.latest).toBe('2024-01-31');
    });
  });

  describe('Amount Statistics', () => {
    it('should calculate amount statistics correctly', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Transport' }),
        createValidRow(3, { date: '2024-01-03', amount: 300, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.amounts.total).toBe(600);
      expect(stats.amounts.average).toBe(200);
      expect(stats.amounts.min).toBe(100);
      expect(stats.amounts.max).toBe(300);
      expect(stats.amounts.positiveCount).toBe(3);
      expect(stats.amounts.negativeCount).toBe(0);
    });

    it('should handle positive and negative amounts', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 1000, category: 'Salary' }),  // Income
        createValidRow(2, { date: '2024-01-02', amount: -50, category: 'Food' }),     // Expense
        createValidRow(3, { date: '2024-01-03', amount: -100, category: 'Transport' }), // Expense
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.amounts.total).toBe(850); // 1000 - 50 - 100
      expect(stats.amounts.positiveCount).toBe(1);
      expect(stats.amounts.negativeCount).toBe(2);
      expect(stats.amounts.positiveTotal).toBe(1000);
      expect(stats.amounts.negativeTotal).toBe(-150);
    });

    it('should handle decimal amounts', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 10.50, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 20.75, category: 'Transport' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.amounts.total).toBe(31.25);
      expect(stats.amounts.average).toBe(15.63); // Rounded to 2 decimals
    });

    it('should return zeros for empty transactions', () => {
      const stats = service.calculateStatistics([]);

      expect(stats.amounts.total).toBe(0);
      expect(stats.amounts.average).toBe(0);
      expect(stats.amounts.min).toBe(0);
      expect(stats.amounts.max).toBe(0);
    });
  });

  describe('Category Statistics', () => {
    it('should count unique categories', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Transport' }),
        createValidRow(3, { date: '2024-01-03', amount: 300, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.categories.total).toBe(3);
    });

    it('should count transactions per category', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Food' }),
        createValidRow(3, { date: '2024-01-03', amount: 300, category: 'Transport' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.categories.total).toBe(2);
      
      const foodCategory = stats.categories.distribution.find((c) => c.category === 'Food');
      expect(foodCategory?.count).toBe(2);
      expect(foodCategory?.percentage).toBe(66.67);
      expect(foodCategory?.totalAmount).toBe(300);

      const transportCategory = stats.categories.distribution.find((c) => c.category === 'Transport');
      expect(transportCategory?.count).toBe(1);
      expect(transportCategory?.percentage).toBe(33.33);
    });

    it('should sort categories by count descending', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Food' }),
        createValidRow(3, { date: '2024-01-03', amount: 300, category: 'Food' }),
        createValidRow(4, { date: '2024-01-04', amount: 400, category: 'Transport' }),
        createValidRow(5, { date: '2024-01-05', amount: 500, category: 'Transport' }),
        createValidRow(6, { date: '2024-01-06', amount: 600, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.categories.distribution[0]?.category).toBe('Food'); // 3 transactions
      expect(stats.categories.distribution[1]?.category).toBe('Transport'); // 2 transactions
      expect(stats.categories.distribution[2]?.category).toBe('Shopping'); // 1 transaction
    });

    it('should calculate total amount per category', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Food' }),
        createValidRow(3, { date: '2024-01-03', amount: -50, category: 'Food' }),
      ];

      const stats = service.calculateStatistics(rows);

      const foodCategory = stats.categories.distribution.find((c) => c.category === 'Food');
      expect(foodCategory?.totalAmount).toBe(250); // 100 + 200 - 50
    });

    it('should return empty distribution for no transactions', () => {
      const stats = service.calculateStatistics([]);

      expect(stats.categories.total).toBe(0);
      expect(stats.categories.distribution).toEqual([]);
    });
  });

  describe('Overview Statistics', () => {
    it('should calculate overview with valid and invalid transactions', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Transport' }),
        createInvalidRow(3),
        createInvalidRow(4),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.overview.totalTransactions).toBe(4);
      expect(stats.overview.validTransactions).toBe(2);
      expect(stats.overview.invalidTransactions).toBe(2);
      expect(stats.overview.validationRate).toBe(50);
    });

    it('should calculate 100% validation rate for all valid', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Transport' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.overview.validationRate).toBe(100);
    });

    it('should calculate 0% validation rate for all invalid', () => {
      const rows: RowValidationResult[] = [
        createInvalidRow(1),
        createInvalidRow(2),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.overview.validationRate).toBe(0);
    });

    it('should handle empty results', () => {
      const stats = service.calculateStatistics([]);

      expect(stats.overview.totalTransactions).toBe(0);
      expect(stats.overview.validTransactions).toBe(0);
      expect(stats.overview.invalidTransactions).toBe(0);
      expect(stats.overview.validationRate).toBe(0);
    });
  });

  describe('Helper Methods', () => {
    it('should get top N categories', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'A' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'A' }),
        createValidRow(3, { date: '2024-01-03', amount: 300, category: 'A' }),
        createValidRow(4, { date: '2024-01-04', amount: 400, category: 'B' }),
        createValidRow(5, { date: '2024-01-05', amount: 500, category: 'B' }),
        createValidRow(6, { date: '2024-01-06', amount: 600, category: 'C' }),
      ];

      const stats = service.calculateStatistics(rows);
      const top2 = service.getTopCategories(stats, 2);

      expect(top2).toHaveLength(2);
      expect(top2[0]?.category).toBe('A');
      expect(top2[1]?.category).toBe('B');
    });

    it('should get income vs expense summary', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 1000, category: 'Salary' }),
        createValidRow(2, { date: '2024-01-02', amount: 500, category: 'Bonus' }),
        createValidRow(3, { date: '2024-01-03', amount: -200, category: 'Food' }),
        createValidRow(4, { date: '2024-01-04', amount: -100, category: 'Transport' }),
      ];

      const stats = service.calculateStatistics(rows);
      const summary = service.getIncomeExpenseSummary(stats);

      expect(summary.income).toBe(1500);
      expect(summary.expenses).toBe(300);
      expect(summary.netBalance).toBe(1200);
    });

    it('should calculate average daily transactions', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-02', amount: 200, category: 'Transport' }),
        createValidRow(3, { date: '2024-01-11', amount: 300, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);
      const avgDaily = service.getAverageDailyTransactions(stats);

      // 3 transactions over 10 days (Jan 1 to Jan 11) = 0.27 per day
      expect(avgDaily).toBe(0.27);
    });

    it('should handle single day for average daily transactions', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-01', amount: 200, category: 'Transport' }),
      ];

      const stats = service.calculateStatistics(rows);
      const avgDaily = service.getAverageDailyTransactions(stats);

      // 2 transactions on same day = 2 per day
      expect(avgDaily).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle only invalid transactions', () => {
      const rows: RowValidationResult[] = [
        createInvalidRow(1),
        createInvalidRow(2),
        createInvalidRow(3),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.dateRange.earliest).toBeNull();
      expect(stats.amounts.total).toBe(0);
      expect(stats.categories.total).toBe(0);
      expect(stats.overview.validTransactions).toBe(0);
    });

    it('should handle mixed valid and invalid rows', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createInvalidRow(2),
        createValidRow(3, { date: '2024-01-03', amount: 300, category: 'Shopping' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.overview.totalTransactions).toBe(3);
      expect(stats.overview.validTransactions).toBe(2);
      expect(stats.amounts.total).toBe(400);
    });

    it('should handle very small amounts', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 0.01, category: 'Test' }),
        createValidRow(2, { date: '2024-01-02', amount: 0.02, category: 'Test' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.amounts.total).toBe(0.03);
      expect(stats.amounts.average).toBe(0.02); // Rounded
    });

    it('should handle very large amounts', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 999999, category: 'Large' }),
        createValidRow(2, { date: '2024-01-02', amount: 1, category: 'Small' }),
      ];

      const stats = service.calculateStatistics(rows);

      expect(stats.amounts.max).toBe(999999);
      expect(stats.amounts.min).toBe(1);
      expect(stats.amounts.total).toBe(1000000);
    });
  });
});
