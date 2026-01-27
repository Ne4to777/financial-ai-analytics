import { z } from 'zod';

/**
 * Date validation schema
 * Accepts ISO format (YYYY-MM-DD) or European format (DD.MM.YYYY)
 */
export const DateSchema = z.string()
  .min(1, 'Date is required')
  .refine(
    (val) => {
      // Check ISO format (YYYY-MM-DD)
      const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
      // Check European format (DD.MM.YYYY)
      const europeanRegex = /^\d{2}\.\d{2}\.\d{4}$/;
      // Check US format (MM/DD/YYYY)
      const usRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      
      return isoRegex.test(val) || europeanRegex.test(val) || usRegex.test(val);
    },
    {
      message: 'Date must be in format YYYY-MM-DD, DD.MM.YYYY, or DD/MM/YYYY',
    }
  )
  .refine(
    (val) => {
      try {
        // Parse date based on format
        let date: Date;
        
        if (val.includes('-')) {
          // ISO format
          date = new Date(val);
        } else if (val.includes('.')) {
          // European format DD.MM.YYYY
          const parts = val.split('.').map(Number);
          if (parts.length !== 3) return false;
          const [day, month, year] = parts as [number, number, number];
          date = new Date(year, month - 1, day);
        } else if (val.includes('/')) {
          // US format MM/DD/YYYY or DD/MM/YYYY (assume DD/MM/YYYY)
          const parts = val.split('/').map(Number);
          if (parts.length !== 3) return false;
          const [day, month, year] = parts as [number, number, number];
          date = new Date(year, month - 1, day);
        } else {
          return false;
        }
        
        // Check if date is valid
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid date value',
    }
  );

/**
 * Amount validation schema
 * Must be a valid number between 0.01 and 1,000,000
 * Can be string (from CSV) or number
 */
export const AmountSchema = z.union([
  z.string(),
  z.number(),
])
  .transform((val) => {
    // Convert string to number
    if (typeof val === 'string') {
      // Remove currency symbols and spaces
      const cleaned = val.replace(/[$€£¥\s,]/g, '');
      return parseFloat(cleaned);
    }
    return val;
  })
  .pipe(
    z.number()
      .finite('Amount must be a finite number')
      .refine(
        (val) => Math.abs(val) >= 0.01,
        'Amount must be at least 0.01 (or -0.01 for expenses)'
      )
      .refine(
        (val) => Math.abs(val) <= 1000000,
        'Amount must not exceed 1,000,000'
      )
  );

/**
 * Category validation schema
 * Required string, max 100 characters
 */
export const CategorySchema = z.string()
  .min(1, 'Category is required')
  .max(100, 'Category must not exceed 100 characters')
  .trim()
  .refine(
    (val) => val.length > 0,
    'Category cannot be empty or whitespace only'
  );

/**
 * Description validation schema
 * Optional string, max 500 characters
 */
export const DescriptionSchema = z.string()
  .max(500, 'Description must not exceed 500 characters')
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((val) => val || undefined);

/**
 * Combined Transaction validation schema
 * Validates a complete transaction record
 */
export const TransactionSchema = z.object({
  date: DateSchema,
  amount: AmountSchema,
  category: CategorySchema,
  description: DescriptionSchema,
});

/**
 * Type inference from schema
 */
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    issues: Array<{
      path: string[];
      message: string;
      code: string;
    }>;
  };
}

/**
 * Validate a single transaction
 * 
 * @param data - Transaction data to validate
 * @returns Validation result
 */
export function validateTransaction(
  data: unknown
): ValidationResult<ValidatedTransaction> {
  const result = TransactionSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
        code: issue.code,
      })),
    },
  };
}

/**
 * Validate multiple transactions
 * 
 * @param data - Array of transaction data
 * @returns Array of validation results with row numbers
 */
export function validateTransactions(
  data: unknown[]
): Array<ValidationResult<ValidatedTransaction> & { row: number }> {
  return data.map((item, index) => ({
    ...validateTransaction(item),
    row: index + 1, // 1-based row numbering
  }));
}

/**
 * Get validation statistics
 * 
 * @param results - Array of validation results
 * @returns Statistics object
 */
export function getValidationStats(
  results: Array<ValidationResult<ValidatedTransaction>>
): {
  total: number;
  valid: number;
  invalid: number;
  successRate: number;
} {
  const valid = results.filter((r) => r.success).length;
  const total = results.length;
  const invalid = total - valid;
  const successRate = total > 0 ? (valid / total) * 100 : 0;

  return {
    total,
    valid,
    invalid,
    successRate: Math.round(successRate * 100) / 100,
  };
}
