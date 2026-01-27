import Papa from 'papaparse';
import fs from 'fs/promises';
import { Readable } from 'stream';

/**
 * CSV parsing error codes
 */
export enum CSVErrorCode {
  PARSE_ERROR = 'PARSE_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  ENCODING_ERROR = 'ENCODING_ERROR',
  EMPTY_FILE = 'EMPTY_FILE',
  NO_HEADERS = 'NO_HEADERS',
  INVALID_FORMAT = 'INVALID_FORMAT',
}

/**
 * CSV parsing error
 */
export class CSVError extends Error {
  constructor(
    public code: CSVErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CSVError';
  }
}

/**
 * Parsed CSV data structure
 */
export interface ParsedCSV {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  errors: Papa.ParseError[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
  };
}

/**
 * CSV parsing configuration
 */
export interface CSVParseConfig {
  header: boolean;
  skipEmptyLines: boolean | 'greedy';
  dynamicTyping: boolean;
  trimHeaders: boolean;
  encoding?: BufferEncoding;
}

/**
 * Default CSV parsing configuration
 */
const DEFAULT_PARSE_CONFIG: CSVParseConfig = {
  header: true,
  skipEmptyLines: 'greedy', // Skip all empty lines including whitespace-only
  dynamicTyping: false, // Keep as strings for validation
  trimHeaders: true,
  encoding: 'utf-8',
};

/**
 * CSV parsing service
 */
export class CSVService {
  /**
   * Parse CSV file from file path
   * 
   * @param filePath - Path to CSV file
   * @param config - Parsing configuration (optional)
   * @returns Parsed CSV data
   */
  async parseFile(
    filePath: string,
    config: Partial<CSVParseConfig> = {}
  ): Promise<ParsedCSV> {
    const parseConfig = { ...DEFAULT_PARSE_CONFIG, ...config };

    try {
      // Read file content
      const buffer = await fs.readFile(filePath);
      const content = buffer.toString(parseConfig.encoding || 'utf-8');

      if (!content || content.length === 0) {
        throw new CSVError(
          CSVErrorCode.EMPTY_FILE,
          'CSV file is empty',
          { filePath }
        );
      }

      // Parse CSV
      return this.parseString(content, parseConfig);
    } catch (error) {
      if (error instanceof CSVError) {
        throw error;
      }

      if (error instanceof Error) {
        if ('code' in error && error.code === 'ENOENT') {
          throw new CSVError(
            CSVErrorCode.FILE_READ_ERROR,
            'CSV file not found',
            { filePath, error: error.message }
          );
        }

        if (error.message.includes('encoding') || error.message.includes('charset')) {
          throw new CSVError(
            CSVErrorCode.ENCODING_ERROR,
            'Failed to read CSV file with specified encoding',
            { filePath, encoding: parseConfig.encoding, error: error.message }
          );
        }
      }

      throw new CSVError(
        CSVErrorCode.FILE_READ_ERROR,
        'Failed to read CSV file',
        {
          filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Parse CSV from string content
   * 
   * @param content - CSV content as string
   * @param config - Parsing configuration (optional)
   * @returns Parsed CSV data
   */
  parseString(
    content: string,
    config: Partial<CSVParseConfig> = {}
  ): ParsedCSV {
    const parseConfig = { ...DEFAULT_PARSE_CONFIG, ...config };

    try {
      const result = Papa.parse(content, {
        header: parseConfig.header,
        skipEmptyLines: parseConfig.skipEmptyLines,
        dynamicTyping: parseConfig.dynamicTyping,
        transformHeader: parseConfig.trimHeaders
          ? (header: string) => header.trim()
          : undefined,
      });

      // Check for parsing errors
      if (result.errors.length > 0) {
        const fatalErrors = result.errors.filter(
          (err) => err.type === 'Quotes' || err.type === 'FieldMismatch'
        );

        if (fatalErrors.length > 0) {
          throw new CSVError(
            CSVErrorCode.PARSE_ERROR,
            'CSV parsing failed with fatal errors',
            {
              errors: fatalErrors.map((err) => ({
                type: err.type,
                code: err.code,
                message: err.message,
                row: err.row,
              })),
            }
          );
        }
      }

      // Extract data
      const rows = result.data as Record<string, unknown>[];

      if (rows.length === 0) {
        throw new CSVError(
          CSVErrorCode.EMPTY_FILE,
          'CSV file contains no data rows',
          {}
        );
      }

      // Get columns from first row
      const columns = Object.keys(rows[0] || {});

      if (columns.length === 0) {
        throw new CSVError(
          CSVErrorCode.NO_HEADERS,
          'CSV file has no headers',
          {}
        );
      }

      return {
        columns,
        rows,
        totalRows: rows.length,
        errors: result.errors,
        meta: {
          delimiter: result.meta.delimiter,
          linebreak: result.meta.linebreak,
          aborted: result.meta.aborted,
          truncated: result.meta.truncated,
        },
      };
    } catch (error) {
      if (error instanceof CSVError) {
        throw error;
      }

      throw new CSVError(
        CSVErrorCode.PARSE_ERROR,
        'Failed to parse CSV content',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Parse CSV from readable stream
   * 
   * @param stream - Readable stream of CSV content
   * @param config - Parsing configuration (optional)
   * @returns Parsed CSV data
   */
  async parseStream(
    stream: Readable,
    config: Partial<CSVParseConfig> = {}
  ): Promise<ParsedCSV> {
    const parseConfig = { ...DEFAULT_PARSE_CONFIG, ...config };

    try {
      // Read entire stream into memory
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      const content = buffer.toString(parseConfig.encoding);

      return this.parseString(content, parseConfig);
    } catch (error) {
      if (error instanceof CSVError) {
        throw error;
      }

      throw new CSVError(
        CSVErrorCode.PARSE_ERROR,
        'Failed to parse CSV stream',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Validate CSV structure
   * Check if CSV has required columns
   * 
   * @param parsed - Parsed CSV data
   * @param requiredColumns - Array of required column names
   * @returns Validation result
   */
  validateColumns(
    parsed: ParsedCSV,
    requiredColumns: string[]
  ): {
    valid: boolean;
    missingColumns: string[];
    extraColumns: string[];
  } {
    const csvColumns = parsed.columns.map((col) => col.toLowerCase());
    const required = requiredColumns.map((col) => col.toLowerCase());

    const missingColumns = required.filter(
      (col) => !csvColumns.includes(col)
    );

    const extraColumns = csvColumns.filter(
      (col) => !required.includes(col)
    );

    return {
      valid: missingColumns.length === 0,
      missingColumns,
      extraColumns,
    };
  }

  /**
   * Get CSV statistics
   * 
   * @param parsed - Parsed CSV data
   * @returns Statistics about the CSV
   */
  getStats(parsed: ParsedCSV): {
    totalRows: number;
    totalColumns: number;
    emptyValues: number;
    parsingErrors: number;
  } {
    let emptyValues = 0;

    for (const row of parsed.rows) {
      for (const value of Object.values(row)) {
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          emptyValues++;
        }
      }
    }

    return {
      totalRows: parsed.totalRows,
      totalColumns: parsed.columns.length,
      emptyValues,
      parsingErrors: parsed.errors.length,
    };
  }
}

// Export singleton instance
export const csvService = new CSVService();
