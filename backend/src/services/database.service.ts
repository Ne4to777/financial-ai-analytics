/**
 * Database Service
 * 
 * Provides CRUD operations for interacting with Supabase database
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import type { TransactionStatistics } from './stats.service.js';
import type { RowValidationResult } from '../types/upload.types.js';
import type { BusinessRulesResult } from '../validators/business.rules.js';

/**
 * Database error codes
 */
export enum DatabaseErrorCode {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  INSERT_ERROR = 'INSERT_ERROR',
  UPDATE_ERROR = 'UPDATE_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Database error class
 */
export class DatabaseError extends Error {
  constructor(
    public code: DatabaseErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Upload record for database
 */
export interface UploadRecord {
  id?: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mimetype: string;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  validation_rate?: number;
  total_warnings: number;
  earliest_transaction_date?: string;
  latest_transaction_date?: string;
  total_amount?: number;
  total_income?: number;
  total_expenses?: number;
  net_balance?: number;
  processing_time_ms?: number;
  error_message?: string;
  error_details?: unknown;
}

/**
 * Transaction record for database
 */
export interface TransactionRecord {
  id?: string;
  upload_id: string;
  row_number: number;
  date: string;
  amount: number;
  category: string;
  description?: string;
  is_valid: boolean;
  validation_errors?: unknown;
  has_warnings: boolean;
  warnings?: unknown;
  raw_data: unknown;
}

/**
 * Database Service Class
 */
export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getSupabaseClient();
  }

  /**
   * Create an upload record
   * 
   * @param upload - Upload data
   * @returns Created upload record with ID
   */
  async createUpload(upload: UploadRecord): Promise<UploadRecord> {
    try {
      const { data, error } = await this.supabase
        .from('uploads')
        .insert([upload])
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error, 'Failed to create upload record');
      }

      if (!data) {
        throw new DatabaseError(
          DatabaseErrorCode.INSERT_ERROR,
          'No data returned after insert'
        );
      }

      return data as UploadRecord;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        DatabaseErrorCode.INSERT_ERROR,
        'Failed to create upload record',
        error
      );
    }
  }

  /**
   * Create multiple transaction records (batch insert)
   * 
   * @param transactions - Array of transaction data
   * @returns Array of created transaction records
   */
  async createTransactions(
    transactions: TransactionRecord[]
  ): Promise<TransactionRecord[]> {
    try {
      // Supabase batch insert
      const { data, error } = await this.supabase
        .from('transactions')
        .insert(transactions)
        .select();

      if (error) {
        throw this.handleSupabaseError(error, 'Failed to create transactions');
      }

      if (!data) {
        throw new DatabaseError(
          DatabaseErrorCode.INSERT_ERROR,
          'No data returned after batch insert'
        );
      }

      return data as TransactionRecord[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        DatabaseErrorCode.INSERT_ERROR,
        'Failed to create transactions',
        error
      );
    }
  }

  /**
   * Update upload status
   * 
   * @param uploadId - Upload ID
   * @param status - New status
   * @param errorMessage - Optional error message
   * @param errorDetails - Optional error details
   */
  async updateUploadStatus(
    uploadId: string,
    status: UploadRecord['status'],
    errorMessage?: string,
    errorDetails?: unknown
  ): Promise<void> {
    try {
      const updateData: Partial<UploadRecord> = {
        status,
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      if (errorDetails) {
        updateData.error_details = errorDetails;
      }

      const { error } = await this.supabase
        .from('uploads')
        .update(updateData)
        .eq('id', uploadId);

      if (error) {
        throw this.handleSupabaseError(error, 'Failed to update upload status');
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        DatabaseErrorCode.UPDATE_ERROR,
        'Failed to update upload status',
        error
      );
    }
  }

  /**
   * Get upload by ID
   * 
   * @param uploadId - Upload ID
   * @returns Upload record or null if not found
   */
  async getUploadById(uploadId: string): Promise<UploadRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('uploads')
        .select('*')
        .eq('id', uploadId)
        .is('deleted_at', null)
        .single();

      if (error) {
        // Not found is not an error, return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw this.handleSupabaseError(error, 'Failed to get upload');
      }

      return data as UploadRecord;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        DatabaseErrorCode.QUERY_ERROR,
        'Failed to get upload',
        error
      );
    }
  }

  /**
   * Get transactions by upload ID
   * 
   * @param uploadId - Upload ID
   * @returns Array of transaction records
   */
  async getTransactionsByUploadId(
    uploadId: string
  ): Promise<TransactionRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('upload_id', uploadId)
        .is('deleted_at', null)
        .order('row_number', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error, 'Failed to get transactions');
      }

      return (data as TransactionRecord[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        DatabaseErrorCode.QUERY_ERROR,
        'Failed to get transactions',
        error
      );
    }
  }

  /**
   * Save upload with transactions atomically
   * This is a convenience method that creates an upload and its transactions
   * 
   * @param uploadData - Upload record data
   * @param validationResults - Row validation results
   * @param businessRules - Business rules results
   * @param statistics - Transaction statistics
   * @returns Created upload record
   */
  async saveUploadWithTransactions(
    uploadData: Omit<UploadRecord, 'id'>,
    validationResults: RowValidationResult[],
    businessRules: BusinessRulesResult,
    statistics: TransactionStatistics
  ): Promise<UploadRecord> {
    try {
      // Create upload record
      const upload = await this.createUpload({
        ...uploadData,
        validation_rate: statistics.overview.validationRate,
        earliest_transaction_date: statistics.dateRange.earliest || undefined,
        latest_transaction_date: statistics.dateRange.latest || undefined,
        total_amount: statistics.amounts.total,
        total_income: statistics.amounts.positiveTotal,
        total_expenses: Math.abs(statistics.amounts.negativeTotal),
        net_balance: statistics.amounts.total,
      });

      if (!upload.id) {
        throw new DatabaseError(
          DatabaseErrorCode.INSERT_ERROR,
          'Upload created but no ID returned'
        );
      }

      // Prepare transaction records
      const transactionRecords: TransactionRecord[] = validationResults.map((result) => {
        // Find warnings for this row
        const rowWarnings = businessRules.warnings.filter((w) => w.row === result.row);

        return {
          upload_id: upload.id!,
          row_number: result.row,
          date: result.data?.date || '',
          amount: result.data?.amount || 0,
          category: result.data?.category || '',
          description: result.data?.description,
          is_valid: result.valid,
          validation_errors: result.errors || null,
          has_warnings: rowWarnings.length > 0,
          warnings: rowWarnings.length > 0 ? rowWarnings : null,
          raw_data: result.rawData,
        };
      });

      // Batch insert transactions
      await this.createTransactions(transactionRecords);

      // Note: Upload statistics will be auto-updated by database trigger

      return upload;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        DatabaseErrorCode.INSERT_ERROR,
        'Failed to save upload with transactions',
        error
      );
    }
  }

  /**
   * Handle Supabase errors and convert to DatabaseError
   */
  private handleSupabaseError(error: any, message: string): DatabaseError {
    // Check for specific PostgreSQL error codes
    if (error.code) {
      // Foreign key violation
      if (error.code === '23503') {
        return new DatabaseError(
          DatabaseErrorCode.CONSTRAINT_VIOLATION,
          'Foreign key constraint violation',
          error
        );
      }

      // Unique constraint violation
      if (error.code === '23505') {
        return new DatabaseError(
          DatabaseErrorCode.CONSTRAINT_VIOLATION,
          'Unique constraint violation',
          error
        );
      }

      // Check constraint violation
      if (error.code === '23514') {
        return new DatabaseError(
          DatabaseErrorCode.CONSTRAINT_VIOLATION,
          'Check constraint violation',
          error
        );
      }

      // Not found
      if (error.code === 'PGRST116') {
        return new DatabaseError(
          DatabaseErrorCode.NOT_FOUND,
          'Record not found',
          error
        );
      }
    }

    // Connection errors
    if (error.message && error.message.includes('connection')) {
      return new DatabaseError(
        DatabaseErrorCode.CONNECTION_ERROR,
        'Database connection error',
        error
      );
    }

    // Default error
    return new DatabaseError(
      DatabaseErrorCode.UNKNOWN_ERROR,
      message,
      error
    );
  }
}

// Export singleton instance (can be initialized when needed)
// Note: In tests, create instances directly with mocked client
export const databaseService = new DatabaseService();
