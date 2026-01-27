/**
 * Business Rules Validator
 * 
 * Validates business logic rules and returns warnings (not hard errors).
 * Used to flag suspicious or unusual data patterns without blocking upload.
 */

import type { ValidatedTransaction, RowValidationResult } from '../types/upload.types';

/**
 * Warning severity levels
 */
export enum WarningSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Business rule warning codes
 */
export enum BusinessRuleCode {
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  UNUSUAL_AMOUNT = 'UNUSUAL_AMOUNT',
  UNKNOWN_CATEGORY = 'UNKNOWN_CATEGORY',
  LARGE_DATE_GAP = 'LARGE_DATE_GAP',
  FUTURE_DATE = 'FUTURE_DATE',
  VERY_OLD_DATE = 'VERY_OLD_DATE',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
}

/**
 * Business rule warning
 */
export interface BusinessRuleWarning {
  row?: number;
  code: BusinessRuleCode;
  severity: WarningSeverity;
  message: string;
  field?: string;
  value?: unknown;
  suggestion?: string;
  relatedRows?: number[]; // For duplicates
}

/**
 * Business rules validation result
 */
export interface BusinessRulesResult {
  warnings: BusinessRuleWarning[];
  stats: {
    totalWarnings: number;
    byCode: Record<BusinessRuleCode, number>;
    bySeverity: Record<WarningSeverity, number>;
  };
}

/**
 * Business rules validation options
 */
export interface BusinessRulesOptions {
  unusualAmountThreshold?: number; // Default: 10000
  dateGapThreshold?: number; // Days, default: 90
  knownCategories?: string[]; // If provided, check against this list
  checkDuplicates?: boolean; // Default: true
  checkAmounts?: boolean; // Default: true
  checkCategories?: boolean; // Default: true
  checkDateGaps?: boolean; // Default: true
}

/**
 * Default known categories
 */
export const DEFAULT_CATEGORIES = [
  'Salary',
  'Wages',
  'Income',
  'Groceries',
  'Food',
  'Dining',
  'Transport',
  'Transportation',
  'Gas',
  'Fuel',
  'Shopping',
  'Retail',
  'Entertainment',
  'Bills',
  'Utilities',
  'Rent',
  'Mortgage',
  'Insurance',
  'Healthcare',
  'Medical',
  'Education',
  'Savings',
  'Investment',
  'Transfer',
  'Other',
];

/**
 * Default business rules options
 */
export const DEFAULT_BUSINESS_RULES_OPTIONS: Required<BusinessRulesOptions> = {
  unusualAmountThreshold: 10000,
  dateGapThreshold: 90,
  knownCategories: DEFAULT_CATEGORIES,
  checkDuplicates: true,
  checkAmounts: true,
  checkCategories: true,
  checkDateGaps: true,
};

/**
 * Business Rules Validator class
 */
export class BusinessRulesValidator {
  private options: Required<BusinessRulesOptions>;

  constructor(options: BusinessRulesOptions = {}) {
    this.options = { ...DEFAULT_BUSINESS_RULES_OPTIONS, ...options };
  }

  /**
   * Validate business rules for all rows
   * 
   * @param validationResults - Row validation results
   * @returns Business rules validation result
   */
  validate(validationResults: RowValidationResult[]): BusinessRulesResult {
    const warnings: BusinessRuleWarning[] = [];

    // Only check valid rows for business rules
    const validRows = validationResults.filter((r) => r.valid && r.data);

    // Check for duplicates
    if (this.options.checkDuplicates) {
      warnings.push(...this.checkDuplicates(validRows));
    }

    // Check for unusual amounts
    if (this.options.checkAmounts) {
      warnings.push(...this.checkUnusualAmounts(validRows));
    }

    // Check for unknown categories
    if (this.options.checkCategories) {
      warnings.push(...this.checkUnknownCategories(validRows));
    }

    // Check for large date gaps
    if (this.options.checkDateGaps) {
      warnings.push(...this.checkDateGaps(validRows));
    }

    // Calculate statistics
    const stats = this.calculateStats(warnings);

    return {
      warnings,
      stats,
    };
  }

  /**
   * Check for duplicate transactions
   * Two transactions are considered duplicates if they have the same:
   * - date
   * - amount
   * - category
   */
  private checkDuplicates(validRows: RowValidationResult[]): BusinessRuleWarning[] {
    const warnings: BusinessRuleWarning[] = [];
    const seen = new Map<string, number[]>(); // key -> row numbers

    for (const row of validRows) {
      if (!row.data) continue;

      const key = this.getDuplicateKey(row.data);
      const existingRows = seen.get(key) || [];

      if (existingRows.length > 0) {
        // Found a duplicate
        warnings.push({
          row: row.row,
          code: BusinessRuleCode.DUPLICATE_TRANSACTION,
          severity: WarningSeverity.WARNING,
          message: 'Possible duplicate transaction detected',
          suggestion: `Similar transaction found in row(s): ${existingRows.join(', ')}`,
          relatedRows: existingRows,
        });
      }

      seen.set(key, [...existingRows, row.row]);
    }

    return warnings;
  }

  /**
   * Generate duplicate key for a transaction
   */
  private getDuplicateKey(transaction: ValidatedTransaction): string {
    return `${transaction.date}|${transaction.amount}|${transaction.category.toLowerCase()}`;
  }

  /**
   * Check for unusual amounts
   */
  private checkUnusualAmounts(validRows: RowValidationResult[]): BusinessRuleWarning[] {
    const warnings: BusinessRuleWarning[] = [];

    for (const row of validRows) {
      if (!row.data) continue;

      const absAmount = Math.abs(row.data.amount);

      if (absAmount > this.options.unusualAmountThreshold) {
        warnings.push({
          row: row.row,
          code: BusinessRuleCode.UNUSUAL_AMOUNT,
          severity: WarningSeverity.INFO,
          message: `Unusually large amount: ${row.data.amount}`,
          field: 'amount',
          value: row.data.amount,
          suggestion: `Amount exceeds $${this.options.unusualAmountThreshold.toLocaleString()}. Please verify this is correct.`,
        });
      }
    }

    return warnings;
  }

  /**
   * Check for unknown categories
   */
  private checkUnknownCategories(validRows: RowValidationResult[]): BusinessRuleWarning[] {
    const warnings: BusinessRuleWarning[] = [];

    // Normalize known categories to lowercase for comparison
    const knownLower = this.options.knownCategories.map((c) => c.toLowerCase());

    for (const row of validRows) {
      if (!row.data) continue;

      const categoryLower = row.data.category.toLowerCase();

      if (!knownLower.includes(categoryLower)) {
        warnings.push({
          row: row.row,
          code: BusinessRuleCode.UNKNOWN_CATEGORY,
          severity: WarningSeverity.INFO,
          message: `Unknown category: "${row.data.category}"`,
          field: 'category',
          value: row.data.category,
          suggestion: 'This category is not in the standard list. Consider using a common category.',
        });
      }
    }

    return warnings;
  }

  /**
   * Check for large date gaps between consecutive transactions
   */
  private checkDateGaps(validRows: RowValidationResult[]): BusinessRuleWarning[] {
    const warnings: BusinessRuleWarning[] = [];

    // Sort rows by date
    const sorted = [...validRows]
      .filter((r) => r.data)
      .sort((a, b) => {
        const dateA = new Date(a.data!.date).getTime();
        const dateB = new Date(b.data!.date).getTime();
        return dateA - dateB;
      });

    // Check gaps between consecutive transactions
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      if (!prev || !curr || !prev.data || !curr.data) continue;

      const prevDate = new Date(prev.data.date);
      const currDate = new Date(curr.data.date);
      const gapDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (gapDays > this.options.dateGapThreshold) {
        warnings.push({
          row: curr.row,
          code: BusinessRuleCode.LARGE_DATE_GAP,
          severity: WarningSeverity.INFO,
          message: `Large date gap detected: ${gapDays} days since previous transaction`,
          field: 'date',
          value: curr.data.date,
          suggestion: `${gapDays} days gap between ${prev.data.date} (row ${prev.row}) and ${curr.data.date} (row ${curr.row}).`,
        });
      }
    }

    return warnings;
  }

  /**
   * Calculate warning statistics
   */
  private calculateStats(warnings: BusinessRuleWarning[]): BusinessRulesResult['stats'] {
    const byCode: Record<BusinessRuleCode, number> = {} as any;
    const bySeverity: Record<WarningSeverity, number> = {} as any;

    // Initialize counters
    for (const code of Object.values(BusinessRuleCode)) {
      byCode[code as BusinessRuleCode] = 0;
    }

    for (const severity of Object.values(WarningSeverity)) {
      bySeverity[severity as WarningSeverity] = 0;
    }

    // Count warnings
    for (const warning of warnings) {
      byCode[warning.code] = (byCode[warning.code] || 0) + 1;
      bySeverity[warning.severity] = (bySeverity[warning.severity] || 0) + 1;
    }

    return {
      totalWarnings: warnings.length,
      byCode,
      bySeverity,
    };
  }

  /**
   * Filter warnings by severity
   */
  filterBySeverity(
    result: BusinessRulesResult,
    severity: WarningSeverity | WarningSeverity[]
  ): BusinessRuleWarning[] {
    const severities = Array.isArray(severity) ? severity : [severity];
    return result.warnings.filter((w) => severities.includes(w.severity));
  }

  /**
   * Filter warnings by code
   */
  filterByCode(
    result: BusinessRulesResult,
    code: BusinessRuleCode | BusinessRuleCode[]
  ): BusinessRuleWarning[] {
    const codes = Array.isArray(code) ? code : [code];
    return result.warnings.filter((w) => codes.includes(w.code));
  }
}

/**
 * Quick validation function with default options
 */
export function validateBusinessRules(
  validationResults: RowValidationResult[],
  options?: BusinessRulesOptions
): BusinessRulesResult {
  const validator = new BusinessRulesValidator(options);
  return validator.validate(validationResults);
}
