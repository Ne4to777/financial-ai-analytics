/**
 * Statistics Service
 * 
 * Calculates advanced statistics for validated transaction data
 */

import type { RowValidationResult, ValidatedTransaction } from '../types/upload.types';

/**
 * Transaction statistics
 */
export interface TransactionStatistics {
  dateRange: {
    earliest: string | null; // ISO date
    latest: string | null;   // ISO date
    spanDays: number;        // Number of days between earliest and latest
  };
  amounts: {
    total: number;      // Sum of all amounts
    average: number;    // Average amount
    min: number;        // Minimum amount
    max: number;        // Maximum amount
    positiveCount: number;  // Count of positive amounts (income)
    negativeCount: number;  // Count of negative amounts (expenses)
    positiveTotal: number;  // Sum of positive amounts
    negativeTotal: number;  // Sum of negative amounts
  };
  categories: {
    total: number;           // Total unique categories
    distribution: Array<{    // Category distribution
      category: string;
      count: number;
      percentage: number;
      totalAmount: number;
    }>;
  };
  overview: {
    totalTransactions: number;
    validTransactions: number;
    invalidTransactions: number;
    validationRate: number; // Percentage
  };
}

/**
 * Statistics Service Class
 */
export class StatsService {
  /**
   * Calculate comprehensive statistics for validated transactions
   * 
   * @param validationResults - Row validation results
   * @returns Transaction statistics
   */
  calculateStatistics(validationResults: RowValidationResult[]): TransactionStatistics {
    // Extract valid transactions only
    const validTransactions = validationResults
      .filter((r) => r.valid && r.data)
      .map((r) => r.data!);

    // Calculate each statistics section
    const dateRange = this.calculateDateRange(validTransactions);
    const amounts = this.calculateAmountStats(validTransactions);
    const categories = this.calculateCategoryStats(validTransactions);
    const overview = this.calculateOverview(validationResults);

    return {
      dateRange,
      amounts,
      categories,
      overview,
    };
  }

  /**
   * Calculate date range statistics
   */
  private calculateDateRange(transactions: ValidatedTransaction[]): TransactionStatistics['dateRange'] {
    if (transactions.length === 0) {
      return {
        earliest: null,
        latest: null,
        spanDays: 0,
      };
    }

    // Sort by date
    const dates = transactions
      .map((t) => new Date(t.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const earliest = dates[0];
    const latest = dates[dates.length - 1];

    if (!earliest || !latest) {
      return {
        earliest: null,
        latest: null,
        spanDays: 0,
      };
    }

    const spanDays = Math.floor(
      (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      earliest: this.formatDate(earliest),
      latest: this.formatDate(latest),
      spanDays,
    };
  }

  /**
   * Calculate amount statistics
   */
  private calculateAmountStats(transactions: ValidatedTransaction[]): TransactionStatistics['amounts'] {
    if (transactions.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        positiveCount: 0,
        negativeCount: 0,
        positiveTotal: 0,
        negativeTotal: 0,
      };
    }

    const amounts = transactions.map((t) => t.amount);
    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    const average = total / amounts.length;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);

    const positiveAmounts = amounts.filter((amt) => amt > 0);
    const negativeAmounts = amounts.filter((amt) => amt < 0);

    const positiveTotal = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
    const negativeTotal = negativeAmounts.reduce((sum, amt) => sum + amt, 0);

    return {
      total: this.round(total, 2),
      average: this.round(average, 2),
      min: this.round(min, 2),
      max: this.round(max, 2),
      positiveCount: positiveAmounts.length,
      negativeCount: negativeAmounts.length,
      positiveTotal: this.round(positiveTotal, 2),
      negativeTotal: this.round(negativeTotal, 2),
    };
  }

  /**
   * Calculate category statistics
   */
  private calculateCategoryStats(transactions: ValidatedTransaction[]): TransactionStatistics['categories'] {
    if (transactions.length === 0) {
      return {
        total: 0,
        distribution: [],
      };
    }

    // Group by category
    const categoryMap = new Map<string, { count: number; totalAmount: number }>();

    for (const transaction of transactions) {
      const category = transaction.category;
      const existing = categoryMap.get(category) || { count: 0, totalAmount: 0 };

      categoryMap.set(category, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + transaction.amount,
      });
    }

    // Build distribution array
    const distribution = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        percentage: this.round((stats.count / transactions.length) * 100, 2),
        totalAmount: this.round(stats.totalAmount, 2),
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return {
      total: categoryMap.size,
      distribution,
    };
  }

  /**
   * Calculate overview statistics
   */
  private calculateOverview(validationResults: RowValidationResult[]): TransactionStatistics['overview'] {
    const totalTransactions = validationResults.length;
    const validTransactions = validationResults.filter((r) => r.valid).length;
    const invalidTransactions = totalTransactions - validTransactions;
    const validationRate = totalTransactions > 0
      ? this.round((validTransactions / totalTransactions) * 100, 2)
      : 0;

    return {
      totalTransactions,
      validTransactions,
      invalidTransactions,
      validationRate,
    };
  }

  /**
   * Format date to ISO string (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Round number to specified decimal places
   */
  private round(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Get top N categories by count
   */
  getTopCategories(
    statistics: TransactionStatistics,
    limit: number = 10
  ): TransactionStatistics['categories']['distribution'] {
    return statistics.categories.distribution.slice(0, limit);
  }

  /**
   * Get spending vs income summary
   */
  getIncomeExpenseSummary(statistics: TransactionStatistics): {
    income: number;
    expenses: number;
    netBalance: number;
  } {
    const income = statistics.amounts.positiveTotal;
    const expenses = Math.abs(statistics.amounts.negativeTotal);
    const netBalance = income - expenses;

    return {
      income: this.round(income, 2),
      expenses: this.round(expenses, 2),
      netBalance: this.round(netBalance, 2),
    };
  }

  /**
   * Calculate average daily transactions
   */
  getAverageDailyTransactions(statistics: TransactionStatistics): number {
    if (statistics.dateRange.spanDays === 0) {
      return statistics.overview.validTransactions;
    }

    return this.round(
      statistics.overview.validTransactions / (statistics.dateRange.spanDays + 1),
      2
    );
  }
}

// Export singleton instance
export const statsService = new StatsService();
