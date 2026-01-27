/**
 * Suggestion Generator
 * 
 * Provides helpful suggestions for common errors to improve user experience
 */

/**
 * Date format patterns for suggestions
 */
const DATE_FORMATS = [
  'YYYY-MM-DD (e.g., 2024-01-15)',
  'DD.MM.YYYY (e.g., 15.01.2024)',
  'DD/MM/YYYY (e.g., 15/01/2024)',
];

/**
 * Common date format mistakes and their corrections
 */
const DATE_FORMAT_CORRECTIONS: Record<string, string> = {
  'MM/DD/YYYY': 'Use DD/MM/YYYY format (day first, not month)',
  'MM-DD-YYYY': 'Use YYYY-MM-DD or DD.MM.YYYY format',
  'DD-MM-YYYY': 'Use YYYY-MM-DD or DD.MM.YYYY format (use . or / as separator)',
  'YYYY/MM/DD': 'Use YYYY-MM-DD format (use - as separator)',
};

/**
 * Generate suggestion for missing CSV columns
 */
export function suggestMissingColumns(
  required: string[],
  found: string[]
): string {
  const missing = required.filter((col) => !found.includes(col));

  if (missing.length === 0) {
    return 'All required columns are present';
  }

  const missingList = missing.map((col) => `"${col}"`).join(', ');
  const suggestions: string[] = [
    `Add the missing column(s): ${missingList}`,
  ];

  // Check for similar column names (typos)
  const similar = findSimilarColumns(missing, found);
  if (similar.length > 0) {
    suggestions.push('');
    suggestions.push('Possible typos detected:');
    similar.forEach(({ required: req, found: fnd, similarity }) => {
      suggestions.push(`  - "${fnd}" might be "${req}" (${Math.round(similarity * 100)}% match)`);
    });
  }

  return suggestions.join('\n');
}

/**
 * Generate suggestion for invalid date format
 */
export function suggestDateFormat(value: string): string {
  const suggestions: string[] = [
    'Invalid date format. Use one of:',
  ];

  DATE_FORMATS.forEach((format) => {
    suggestions.push(`  - ${format}`);
  });

  // Detect common mistakes
  const detectedFormat = detectDateFormat(value);
  if (detectedFormat && DATE_FORMAT_CORRECTIONS[detectedFormat]) {
    suggestions.push('');
    suggestions.push(`Detected format: ${detectedFormat}`);
    suggestions.push(`Suggestion: ${DATE_FORMAT_CORRECTIONS[detectedFormat]}`);
  }

  // Try to extract date parts and suggest correction
  const correction = attemptDateCorrection(value);
  if (correction) {
    suggestions.push('');
    suggestions.push(`Did you mean: ${correction}?`);
  }

  return suggestions.join('\n');
}

/**
 * Generate suggestion for invalid amount
 */
export function suggestAmountFormat(value: string | number): string {
  const valueStr = String(value);
  const suggestions: string[] = [];

  // Check for currency symbols
  if (/[$£€¥₹]/.test(valueStr)) {
    suggestions.push('Remove currency symbols (e.g., $, £, €)');
  }

  // Check for thousands separators
  if (/,/.test(valueStr)) {
    const corrected = valueStr.replace(/,/g, '');
    suggestions.push(`Remove commas: "${valueStr}" → "${corrected}"`);
  }

  // Check for multiple decimal points
  if ((valueStr.match(/\./g) || []).length > 1) {
    suggestions.push('Use only one decimal point');
  }

  // Check for spaces
  if (/\s/.test(valueStr)) {
    const corrected = valueStr.replace(/\s/g, '');
    suggestions.push(`Remove spaces: "${valueStr}" → "${corrected}"`);
  }

  // Check for non-numeric characters
  if (/[^0-9.\-+]/.test(valueStr)) {
    const cleaned = valueStr.replace(/[^0-9.\-+]/g, '');
    if (cleaned && cleaned !== valueStr) {
      suggestions.push(`Remove non-numeric characters: "${valueStr}" → "${cleaned}"`);
    }
  }

  // General format advice
  if (suggestions.length === 0) {
    suggestions.push('Use numeric format with optional decimal point');
    suggestions.push('Examples: 100, 100.50, -50.25');
    suggestions.push('Range: 0.01 to 1,000,000');
  }

  return suggestions.join('\n');
}

/**
 * Generate suggestion for file errors
 */
export function suggestFileError(errorType: 'size' | 'type' | 'empty' | 'missing'): string {
  const suggestions: Record<typeof errorType, string[]> = {
    size: [
      'File is too large. Maximum size: 10 MB',
      'Try reducing the file size:',
      '  - Remove unnecessary columns',
      '  - Split into multiple smaller files',
      '  - Compress with ZIP (if supported)',
    ],
    type: [
      'Invalid file type. Only CSV files are accepted',
      'Ensure your file:',
      '  - Has .csv extension',
      '  - Is saved as CSV format (not Excel .xlsx)',
      '  - Uses comma (,) as delimiter',
    ],
    empty: [
      'File is empty or contains no data',
      'Ensure your file:',
      '  - Contains a header row with column names',
      '  - Contains at least one data row',
      '  - Is not corrupted',
    ],
    missing: [
      'File not found or could not be read',
      'Try:',
      '  - Re-uploading the file',
      '  - Checking file permissions',
      '  - Ensuring file is not corrupted',
    ],
  };

  return suggestions[errorType].join('\n');
}

/**
 * Generate suggestion for invalid category
 */
export function suggestCategory(value: string, knownCategories: string[]): string {
  const suggestions: string[] = [
    `Unknown category: "${value}"`,
  ];

  // Find similar categories
  const similar = knownCategories
    .map((cat) => ({
      category: cat,
      similarity: calculateSimilarity(value.toLowerCase(), cat.toLowerCase()),
    }))
    .filter(({ similarity }) => similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  if (similar.length > 0) {
    suggestions.push('');
    suggestions.push('Did you mean:');
    similar.forEach(({ category, similarity }) => {
      suggestions.push(`  - ${category} (${Math.round(similarity * 100)}% match)`);
    });
  } else {
    suggestions.push('');
    suggestions.push('Available categories:');
    knownCategories.slice(0, 10).forEach((cat) => {
      suggestions.push(`  - ${cat}`);
    });
    if (knownCategories.length > 10) {
      suggestions.push(`  ... and ${knownCategories.length - 10} more`);
    }
  }

  return suggestions.join('\n');
}

/**
 * Generate general validation suggestion
 */
export function suggestValidation(field: string, message: string): string {
  const fieldSuggestions: Record<string, string[]> = {
    date: [
      'Check date format: YYYY-MM-DD, DD.MM.YYYY, or DD/MM/YYYY',
      'Ensure date is between 2020-01-01 and today',
      'Verify date is valid (e.g., not Feb 30)',
    ],
    amount: [
      'Use numeric format: 100 or 100.50',
      'Remove currency symbols and commas',
      'Ensure amount is between 0.01 and 1,000,000',
    ],
    category: [
      'Use one of the predefined categories',
      'Check for typos in category name',
      'Category names are case-sensitive',
    ],
    description: [
      'Keep description under 500 characters',
      'Use plain text (no special formatting)',
      'Description is optional',
    ],
  };

  const suggestions = fieldSuggestions[field] || [
    'Check the value format',
    'Ensure the value meets requirements',
    'Refer to documentation for valid formats',
  ];

  return [message, '', 'Suggestions:', ...suggestions.map((s) => `  - ${s}`)].join('\n');
}

/**
 * Find similar column names (for typo detection)
 */
function findSimilarColumns(
  required: string[],
  found: string[]
): Array<{ required: string; found: string; similarity: number }> {
  const similar: Array<{ required: string; found: string; similarity: number }> = [];

  required.forEach((req) => {
    found.forEach((fnd) => {
      const similarity = calculateSimilarity(
        req.toLowerCase(),
        fnd.toLowerCase()
      );
      if (similarity > 0.6 && similarity < 1.0) {
        similar.push({ required: req, found: fnd, similarity });
      }
    });
  });

  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length]![str1.length]!;
}

/**
 * Detect date format pattern
 */
function detectDateFormat(value: string): string | null {
  const patterns: Record<string, RegExp> = {
    'MM/DD/YYYY': /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    'MM-DD-YYYY': /^\d{1,2}-\d{1,2}-\d{4}$/,
    'DD-MM-YYYY': /^\d{1,2}-\d{1,2}-\d{4}$/,
    'YYYY/MM/DD': /^\d{4}\/\d{1,2}\/\d{1,2}$/,
  };

  for (const [format, regex] of Object.entries(patterns)) {
    if (regex.test(value)) {
      return format;
    }
  }

  return null;
}

/**
 * Attempt to correct date format
 */
function attemptDateCorrection(value: string): string | null {
  // Try to extract numbers
  const numbers = value.match(/\d+/g);
  if (!numbers || numbers.length !== 3) {
    return null;
  }

  const first = Number(numbers[0]);
  const second = Number(numbers[1]);
  const third = Number(numbers[2]);

  // If third part is a 4-digit year
  if (third >= 1000 && third <= 9999) {
    // Likely DD/MM/YYYY or DD.MM.YYYY
    if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
      const day = String(first).padStart(2, '0');
      const month = String(second).padStart(2, '0');
      return `${third}-${month}-${day}`;
    }
  }

  // If first part is a 4-digit year
  if (first >= 1000 && first <= 9999) {
    // Likely YYYY-MM-DD or YYYY/MM/DD
    if (second >= 1 && second <= 12 && third >= 1 && third <= 31) {
      const month = String(second).padStart(2, '0');
      const day = String(third).padStart(2, '0');
      return `${first}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Export all suggestion functions
 */
export const suggestions = {
  missingColumns: suggestMissingColumns,
  dateFormat: suggestDateFormat,
  amountFormat: suggestAmountFormat,
  fileError: suggestFileError,
  category: suggestCategory,
  validation: suggestValidation,
};
