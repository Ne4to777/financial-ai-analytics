import { describe, it, expect } from 'vitest';
import {
  BusinessRulesValidator,
  validateBusinessRules,
  BusinessRuleCode,
  WarningSeverity,
  DEFAULT_CATEGORIES,
  type BusinessRuleWarning,
} from '../../src/validators/business.rules';
import type { RowValidationResult, ValidatedTransaction } from '../../src/types/upload.types';

// Helper to create valid row result
function createValidRow(
  row: number,
  transaction: ValidatedTransaction
): RowValidationResult {
  return {
    row,
    valid: true,
    data: transaction,
    rawData: transaction as any,
  };
}

// Helper to create invalid row result
function createInvalidRow(row: number): RowValidationResult {
  return {
    row,
    valid: false,
    errors: [{ path: ['date'], message: 'Invalid date', code: 'invalid_date' }],
    rawData: {},
  };
}

describe('Business Rules Validator', () => {
  describe('Duplicate Detection', () => {
    it('should detect duplicate transactions', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.DUPLICATE_TRANSACTION);
      expect(result.warnings[0]?.row).toBe(2);
      expect(result.warnings[0]?.relatedRows).toEqual([1]);
    });

    it('should detect multiple duplicates', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(3, { date: '2024-01-15', amount: 100, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(2); // Row 2 and Row 3 are duplicates
      expect(result.warnings[0]?.row).toBe(2);
      expect(result.warnings[1]?.row).toBe(3);
    });

    it('should not flag similar transactions with different dates', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-16', amount: 100, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      const duplicates = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.DUPLICATE_TRANSACTION
      );
      expect(duplicates.length).toBe(0);
    });

    it('should not flag similar transactions with different amounts', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100.01, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      const duplicates = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.DUPLICATE_TRANSACTION
      );
      expect(duplicates.length).toBe(0);
    });

    it('should be case-insensitive for category comparison', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.DUPLICATE_TRANSACTION);
    });

    it('should skip duplicate checking if disabled', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator({ checkDuplicates: false });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Unusual Amount Detection', () => {
    it('should flag amounts above threshold', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 15000, category: 'Income' }),
      ];

      const validator = new BusinessRulesValidator({ unusualAmountThreshold: 10000 });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.UNUSUAL_AMOUNT);
      expect(result.warnings[0]?.severity).toBe(WarningSeverity.INFO);
      expect(result.warnings[0]?.field).toBe('amount');
    });

    it('should flag negative amounts above threshold', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: -15000, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator({ unusualAmountThreshold: 10000 });
      const result = validator.validate(rows);

      const unusualAmount = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.UNUSUAL_AMOUNT
      );
      expect(unusualAmount.length).toBe(1);
      expect(unusualAmount[0]?.code).toBe(BusinessRuleCode.UNUSUAL_AMOUNT);
    });

    it('should not flag amounts below threshold', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 5000, category: 'Income' }),
      ];

      const validator = new BusinessRulesValidator({ unusualAmountThreshold: 10000 });
      const result = validator.validate(rows);

      const unusualAmount = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.UNUSUAL_AMOUNT
      );
      expect(unusualAmount.length).toBe(0);
    });

    it('should use custom threshold', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 600, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator({ unusualAmountThreshold: 500 });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.UNUSUAL_AMOUNT);
    });

    it('should skip amount checking if disabled', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 50000, category: 'Income' }),
      ];

      const validator = new BusinessRulesValidator({ checkAmounts: false });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Unknown Category Detection', () => {
    it('should flag unknown categories', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'UnknownCategory' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      const unknownCategory = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.UNKNOWN_CATEGORY
      );
      expect(unknownCategory.length).toBe(1);
      expect(unknownCategory[0]?.field).toBe('category');
      expect(unknownCategory[0]?.value).toBe('UnknownCategory');
    });

    it('should not flag known categories', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-16', amount: 200, category: 'Transport' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      const unknownCategory = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.UNKNOWN_CATEGORY
      );
      expect(unknownCategory.length).toBe(0);
    });

    it('should be case-insensitive for category checking', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'FOOD' }),
        createValidRow(2, { date: '2024-01-16', amount: 200, category: 'food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      const unknownCategory = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.UNKNOWN_CATEGORY
      );
      expect(unknownCategory.length).toBe(0);
    });

    it('should use custom known categories', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'CustomCategory' }),
      ];

      const validator = new BusinessRulesValidator({
        knownCategories: ['CustomCategory'],
      });
      const result = validator.validate(rows);

      const unknownCategory = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.UNKNOWN_CATEGORY
      );
      expect(unknownCategory.length).toBe(0);
    });

    it('should skip category checking if disabled', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'UnknownCategory' }),
      ];

      const validator = new BusinessRulesValidator({ checkCategories: false });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Date Gap Detection', () => {
    it('should detect large date gaps', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-06-01', amount: 200, category: 'Transport' }), // 152 days gap
      ];

      const validator = new BusinessRulesValidator({ dateGapThreshold: 90 });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.LARGE_DATE_GAP);
      expect(result.warnings[0]?.row).toBe(2);
      expect(result.warnings[0]?.message).toContain('152 days');
    });

    it('should not flag small date gaps', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 200, category: 'Transport' }), // 14 days
      ];

      const validator = new BusinessRulesValidator({ dateGapThreshold: 90 });
      const result = validator.validate(rows);

      const dateGaps = result.warnings.filter(
        (w) => w.code === BusinessRuleCode.LARGE_DATE_GAP
      );
      expect(dateGaps.length).toBe(0);
    });

    it('should sort rows by date before checking gaps', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-06-01', amount: 200, category: 'Transport' }),
        createValidRow(2, { date: '2024-01-01', amount: 100, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator({ dateGapThreshold: 90 });
      const result = validator.validate(rows);

      // Should still detect the gap even though rows are in wrong order
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.LARGE_DATE_GAP);
    });

    it('should use custom date gap threshold', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-31', amount: 200, category: 'Transport' }), // 30 days
      ];

      const validator = new BusinessRulesValidator({ dateGapThreshold: 20 });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.LARGE_DATE_GAP);
    });

    it('should skip date gap checking if disabled', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-01', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-12-31', amount: 200, category: 'Transport' }),
      ];

      const validator = new BusinessRulesValidator({ checkDateGaps: false });
      const result = validator.validate(rows);

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate total warnings', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }), // Duplicate
        createValidRow(3, { date: '2024-01-16', amount: 15000, category: 'Income' }), // Unusual amount
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      expect(result.stats.totalWarnings).toBe(2);
    });

    it('should count warnings by code', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(3, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(4, { date: '2024-01-16', amount: 15000, category: 'Income' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      expect(result.stats.byCode[BusinessRuleCode.DUPLICATE_TRANSACTION]).toBe(2);
      expect(result.stats.byCode[BusinessRuleCode.UNUSUAL_AMOUNT]).toBe(1);
    });

    it('should count warnings by severity', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }), // WARNING
        createValidRow(3, { date: '2024-01-16', amount: 15000, category: 'UnknownCat' }), // 2x INFO
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      expect(result.stats.bySeverity[WarningSeverity.WARNING]).toBeGreaterThan(0);
      expect(result.stats.bySeverity[WarningSeverity.INFO]).toBeGreaterThan(0);
    });
  });

  describe('Filter Methods', () => {
    it('should filter warnings by severity', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }), // WARNING
        createValidRow(3, { date: '2024-01-16', amount: 15000, category: 'Income' }), // INFO
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);
      const warnings = validator.filterBySeverity(result, WarningSeverity.WARNING);

      expect(warnings.every((w) => w.severity === WarningSeverity.WARNING)).toBe(true);
    });

    it('should filter warnings by code', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(2, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createValidRow(3, { date: '2024-01-16', amount: 15000, category: 'Income' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);
      const duplicates = validator.filterByCode(
        result,
        BusinessRuleCode.DUPLICATE_TRANSACTION
      );

      expect(duplicates.every((w) => w.code === BusinessRuleCode.DUPLICATE_TRANSACTION)).toBe(true);
    });
  });

  describe('Integration with Invalid Rows', () => {
    it('should only check valid rows', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 100, category: 'Food' }),
        createInvalidRow(2), // Invalid row
        createValidRow(3, { date: '2024-01-15', amount: 100, category: 'Food' }),
      ];

      const validator = new BusinessRulesValidator();
      const result = validator.validate(rows);

      // Should detect duplicate between row 1 and 3, ignoring invalid row 2
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.DUPLICATE_TRANSACTION);
      expect(result.warnings[0]?.row).toBe(3);
    });
  });

  describe('Quick Validation Function', () => {
    it('should work with validateBusinessRules helper', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 15000, category: 'Income' }),
      ];

      const result = validateBusinessRules(rows);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.stats).toBeDefined();
    });

    it('should accept custom options', () => {
      const rows: RowValidationResult[] = [
        createValidRow(1, { date: '2024-01-15', amount: 600, category: 'Food' }),
      ];

      const result = validateBusinessRules(rows, { unusualAmountThreshold: 500 });

      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]?.code).toBe(BusinessRuleCode.UNUSUAL_AMOUNT);
    });
  });

  describe('DEFAULT_CATEGORIES', () => {
    it('should include common categories', () => {
      expect(DEFAULT_CATEGORIES).toContain('Food');
      expect(DEFAULT_CATEGORIES).toContain('Transport');
      expect(DEFAULT_CATEGORIES).toContain('Salary');
      expect(DEFAULT_CATEGORIES).toContain('Bills');
    });

    it('should have reasonable length', () => {
      expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(10);
      expect(DEFAULT_CATEGORIES.length).toBeLessThan(50);
    });
  });
});
