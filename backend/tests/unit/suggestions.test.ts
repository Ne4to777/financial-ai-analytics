import { describe, it, expect } from 'vitest';
import {
  suggestMissingColumns,
  suggestDateFormat,
  suggestAmountFormat,
  suggestFileError,
  suggestCategory,
  suggestValidation,
} from '../../src/utils/suggestions';

describe('Suggestion Generator', () => {
  describe('suggestMissingColumns', () => {
    it('should suggest missing columns', () => {
      const required = ['date', 'amount', 'category'];
      const found = ['date', 'amount'];

      const suggestion = suggestMissingColumns(required, found);

      expect(suggestion).toContain('category');
      expect(suggestion).toContain('Add the missing column');
    });

    it('should detect no missing columns', () => {
      const required = ['date', 'amount'];
      const found = ['date', 'amount', 'description'];

      const suggestion = suggestMissingColumns(required, found);

      expect(suggestion).toContain('All required columns are present');
    });

    it('should detect similar column names (typos)', () => {
      const required = ['date', 'amount', 'category'];
      const found = ['date', 'ammount', 'categorie'];

      const suggestion = suggestMissingColumns(required, found);

      expect(suggestion).toContain('Possible typos');
      expect(suggestion).toContain('ammount');
      expect(suggestion).toContain('amount');
    });

    it('should handle multiple missing columns', () => {
      const required = ['date', 'amount', 'category', 'description'];
      const found = ['date'];

      const suggestion = suggestMissingColumns(required, found);

      expect(suggestion).toContain('amount');
      expect(suggestion).toContain('category');
      expect(suggestion).toContain('description');
    });
  });

  describe('suggestDateFormat', () => {
    it('should suggest valid date formats', () => {
      const suggestion = suggestDateFormat('15-01-2024');

      expect(suggestion).toContain('YYYY-MM-DD');
      expect(suggestion).toContain('DD.MM.YYYY');
      expect(suggestion).toContain('DD/MM/YYYY');
    });

    it('should detect MM/DD/YYYY format and suggest correction', () => {
      const suggestion = suggestDateFormat('01/15/2024');

      expect(suggestion).toContain('MM/DD/YYYY');
      expect(suggestion).toContain('day first');
    });

    it('should detect DD-MM-YYYY format and suggest correction', () => {
      const suggestion = suggestDateFormat('15-01-2024');

      // Date correction should be attempted
      expect(suggestion).toContain('Did you mean');
      expect(suggestion).toContain('2024-01-15');
    });

    it('should attempt to correct date format', () => {
      const suggestion = suggestDateFormat('15/01/2024');

      expect(suggestion).toContain('Did you mean');
      expect(suggestion).toContain('2024-01-15');
    });

    it('should handle invalid date strings', () => {
      const suggestion = suggestDateFormat('not-a-date');

      expect(suggestion).toContain('Invalid date format');
      expect(suggestion).toContain('Use one of');
    });
  });

  describe('suggestAmountFormat', () => {
    it('should suggest removing currency symbols', () => {
      const suggestion = suggestAmountFormat('$100.50');

      expect(suggestion).toContain('Remove currency symbols');
    });

    it('should suggest removing commas', () => {
      const suggestion = suggestAmountFormat('1,000.50');

      expect(suggestion).toContain('Remove commas');
      expect(suggestion).toContain('1000.50');
    });

    it('should suggest removing spaces', () => {
      const suggestion = suggestAmountFormat('1 000');

      expect(suggestion).toContain('Remove spaces');
      expect(suggestion).toContain('1000');
    });

    it('should suggest removing non-numeric characters', () => {
      const suggestion = suggestAmountFormat('100abc');

      expect(suggestion).toContain('non-numeric');
      expect(suggestion).toContain('100');
    });

    it('should detect multiple decimal points', () => {
      const suggestion = suggestAmountFormat('100.50.25');

      expect(suggestion).toContain('one decimal point');
    });

    it('should provide general format advice for valid-looking numbers', () => {
      const suggestion = suggestAmountFormat('abc');

      expect(suggestion).toContain('numeric format');
      expect(suggestion).toContain('Examples');
    });

    it('should handle numeric input', () => {
      const suggestion = suggestAmountFormat(100);

      expect(suggestion).toContain('numeric format');
    });
  });

  describe('suggestFileError', () => {
    it('should suggest for file size error', () => {
      const suggestion = suggestFileError('size');

      expect(suggestion).toContain('too large');
      expect(suggestion).toContain('10 MB');
      expect(suggestion).toContain('Split into multiple');
    });

    it('should suggest for file type error', () => {
      const suggestion = suggestFileError('type');

      expect(suggestion).toContain('Invalid file type');
      expect(suggestion).toContain('.csv');
      expect(suggestion).toContain('comma');
    });

    it('should suggest for empty file error', () => {
      const suggestion = suggestFileError('empty');

      expect(suggestion).toContain('empty');
      expect(suggestion).toContain('header row');
      expect(suggestion).toContain('data row');
    });

    it('should suggest for missing file error', () => {
      const suggestion = suggestFileError('missing');

      expect(suggestion).toContain('not found');
      expect(suggestion).toContain('Re-uploading');
    });
  });

  describe('suggestCategory', () => {
    const knownCategories = [
      'Food',
      'Transport',
      'Entertainment',
      'Shopping',
      'Healthcare',
      'Education',
    ];

    it('should suggest similar categories', () => {
      const suggestion = suggestCategory('Foo', knownCategories);

      expect(suggestion).toContain('Unknown category');
      expect(suggestion).toContain('Did you mean');
      expect(suggestion).toContain('Food');
    });

    it('should list available categories if no similar match', () => {
      const suggestion = suggestCategory('XYZ', knownCategories);

      expect(suggestion).toContain('Available categories');
      expect(suggestion).toContain('Food');
      expect(suggestion).toContain('Transport');
    });

    it('should show similarity percentage', () => {
      const suggestion = suggestCategory('Foo', knownCategories);

      expect(suggestion).toMatch(/\d+% match/);
    });

    it('should handle many categories gracefully', () => {
      const manyCategories = Array.from({ length: 20 }, (_, i) => `Category${i}`);
      const suggestion = suggestCategory('Unknown', manyCategories);

      expect(suggestion).toContain('and 10 more');
    });

    it('should rank suggestions by similarity', () => {
      const suggestion = suggestCategory('Foood', knownCategories);

      // Food should be suggested first (highest similarity)
      expect(suggestion).toContain('Food');
      expect(suggestion).toContain('Did you mean');
      
      // Food should appear before other suggestions
      const foodIndex = suggestion.indexOf('Food');
      const availableIndex = suggestion.indexOf('Available categories');
      
      // If "Did you mean" section exists, Food should appear in it
      if (availableIndex > -1) {
        expect(foodIndex).toBeLessThan(availableIndex);
      }
    });
  });

  describe('suggestValidation', () => {
    it('should suggest for date field', () => {
      const suggestion = suggestValidation('date', 'Invalid date');

      expect(suggestion).toContain('Invalid date');
      expect(suggestion).toContain('date format');
      expect(suggestion).toContain('2020-01-01');
    });

    it('should suggest for amount field', () => {
      const suggestion = suggestValidation('amount', 'Invalid amount');

      expect(suggestion).toContain('Invalid amount');
      expect(suggestion).toContain('numeric format');
      expect(suggestion).toContain('currency symbols');
    });

    it('should suggest for category field', () => {
      const suggestion = suggestValidation('category', 'Invalid category');

      expect(suggestion).toContain('Invalid category');
      expect(suggestion).toContain('predefined categories');
      expect(suggestion).toContain('case-sensitive');
    });

    it('should suggest for description field', () => {
      const suggestion = suggestValidation('description', 'Too long');

      expect(suggestion).toContain('Too long');
      expect(suggestion).toContain('500 characters');
      expect(suggestion).toContain('optional');
    });

    it('should provide generic suggestions for unknown fields', () => {
      const suggestion = suggestValidation('unknown', 'Invalid value');

      expect(suggestion).toContain('Invalid value');
      expect(suggestion).toContain('Check the value format');
    });
  });

  describe('String Similarity', () => {
    it('should detect similar column names with typos', () => {
      const required = ['amount'];
      const found = ['ammount'];

      const suggestion = suggestMissingColumns(required, found);

      expect(suggestion).toContain('ammount');
      expect(suggestion).toContain('amount');
    });

    it('should detect case differences', () => {
      const required = ['Category'];
      const found = ['category'];

      const suggestion = suggestMissingColumns(required, found);

      // Should identify as missing (exact match check is case-sensitive)
      expect(suggestion).toContain('Category');
      expect(suggestion).toContain('missing column');
    });

    it('should not suggest exact matches', () => {
      const required = ['date', 'amount'];
      const found = ['date', 'amount'];

      const suggestion = suggestMissingColumns(required, found);

      expect(suggestion).not.toContain('Possible typos');
    });
  });

  describe('Date Correction', () => {
    it('should correct DD/MM/YYYY to YYYY-MM-DD', () => {
      const suggestion = suggestDateFormat('15/01/2024');

      expect(suggestion).toContain('2024-01-15');
    });

    it('should correct DD.MM.YYYY to YYYY-MM-DD', () => {
      const suggestion = suggestDateFormat('15.01.2024');

      expect(suggestion).toContain('2024-01-15');
    });

    it('should handle YYYY/MM/DD format', () => {
      const suggestion = suggestDateFormat('2024/01/15');

      expect(suggestion).toContain('2024-01-15');
    });

    it('should not suggest correction for invalid dates', () => {
      const suggestion = suggestDateFormat('99/99/9999');

      expect(suggestion).toContain('Invalid date format');
    });
  });

  describe('Amount Corrections', () => {
    it('should handle multiple issues at once', () => {
      const suggestion = suggestAmountFormat('$1,000.50');

      expect(suggestion).toContain('currency symbols');
      expect(suggestion).toContain('commas');
    });

    it('should suggest clean numeric value', () => {
      const suggestion = suggestAmountFormat('€ 1 000,50');

      expect(suggestion).toContain('Remove currency symbols');
      expect(suggestion).toContain('Remove spaces');
    });
  });
});
