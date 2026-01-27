/**
 * Swagger/OpenAPI Configuration
 * 
 * Comprehensive API documentation
 */

export const swaggerExamples = {
  successResponse: {
    success: true,
    message: 'CSV file uploaded and processed successfully',
    data: {
      uploadId: '550e8400-e29b-41d4-a716-446655440000',
      file: {
        filename: 'transactions_1705332600000.csv',
        mimetype: 'text/csv',
        encoding: '7bit',
        size: 15420,
      },
      csv: {
        totalRows: 100,
        totalColumns: 4,
        columns: ['date', 'amount', 'category', 'description'],
        delimiter: ',',
        linebreak: '\n',
        hasErrors: false,
        errorCount: 0,
      },
      preview: [
        {
          date: '2024-01-15',
          amount: '1500.00',
          category: 'Salary',
          description: 'Monthly salary',
          _validation: {
            row: 1,
            valid: true,
            errors: [],
          },
        },
        {
          date: '2024-01-16',
          amount: '-50.00',
          category: 'Food',
          description: 'Groceries',
          _validation: {
            row: 2,
            valid: true,
            errors: [],
          },
        },
      ],
      statistics: {
        totalRows: 100,
        validRows: 98,
        invalidRows: 2,
        warnings: 5,
      },
      validation: {
        successRate: 98.0,
        errorsByField: {
          date: 1,
          amount: 1,
        },
        commonErrors: [
          {
            field: 'date',
            message: 'Invalid date format',
            count: 1,
          },
        ],
      },
      advancedStatistics: {
        dateRange: {
          earliest: '2024-01-01',
          latest: '2024-12-31',
          daysCovered: 366,
        },
        amounts: {
          total: 15000.50,
          average: 150.005,
          min: -500.00,
          max: 5000.00,
          positiveTotal: 20000.00,
          negativeTotal: -5000.00,
        },
        categories: {
          total: 12,
          topCategories: [
            { category: 'Salary', count: 12, percentage: 12.0 },
            { category: 'Food', count: 30, percentage: 30.0 },
          ],
        },
        summary: {
          totalIncome: 20000.00,
          totalExpenses: 5000.00,
          netBalance: 15000.00,
          averageDailyTransactions: 0.273,
        },
      },
      receivedAt: '2024-01-26T15:30:00.000Z',
      processingTime: 125,
    },
  },

  validationErrorResponse: {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message: 'CSV file contains invalid data',
      details: {
        errors: [
          {
            row: 5,
            field: 'date',
            message: 'Invalid date format. Expected YYYY-MM-DD or DD.MM.YYYY',
            value: '15/01/2024',
            suggestion: 'Change to \'2024-01-15\' or \'15.01.2024\'',
          },
          {
            row: 8,
            field: 'amount',
            message: 'Amount must be a valid number',
            value: '$1,500',
            suggestion: 'Remove currency symbols and commas: "1500"',
          },
        ],
      },
    },
  },

  missingColumnsError: {
    success: false,
    error: {
      code: 'CSV_MISSING_COLUMNS',
      message: 'CSV file is missing required columns',
      details: {
        required: ['date', 'amount', 'category'],
        found: ['date', 'amount'],
        missing: ['category'],
        suggestion: 'Add the missing column(s): "category"',
      },
    },
  },

  fileTooLargeError: {
    success: false,
    error: {
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 10485760 bytes',
      details: {
        maxSize: 10485760,
        actualSize: 15000000,
      },
    },
  },

  invalidFileTypeError: {
    success: false,
    error: {
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Expected .csv but got .xlsx',
      details: {
        expected: ['.csv'],
        actual: '.xlsx',
      },
    },
  },
};

export const swaggerRequestBody = {
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'CSV file to upload (max 10MB)',
          },
        },
      },
      examples: {
        csvFile: {
          summary: 'CSV file with transactions',
          description: 'A CSV file containing transaction data with required columns: date, amount, category',
        },
      },
    },
  },
};
