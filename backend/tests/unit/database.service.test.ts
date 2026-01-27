import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Supabase config before importing DatabaseService
vi.mock('../../src/config/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({})),
  createSupabaseClient: vi.fn(() => ({})),
}));

import { DatabaseService, DatabaseError, DatabaseErrorCode } from '../../src/services/database.service';
import type { UploadRecord, TransactionRecord } from '../../src/services/database.service';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockIs = vi.fn();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      is: mockIs,
      single: mockSingle,
      order: mockOrder,
    },
  };
};

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new DatabaseService(mockClient as any);
  });

  describe('createUpload', () => {
    it('should create an upload record successfully', async () => {
      const uploadData: UploadRecord = {
        filename: 'test.csv',
        original_filename: 'test.csv',
        file_path: '/uploads/test.csv',
        file_size: 1000,
        mimetype: 'text/csv',
        status: 'processing',
        total_rows: 10,
        valid_rows: 8,
        invalid_rows: 2,
        total_warnings: 0,
      };

      const mockResponse = { ...uploadData, id: 'upload-123' };

      // Setup mock chain
      mockClient._mocks.select.mockReturnValue({
        single: mockClient._mocks.single,
      });
      mockClient._mocks.single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });
      mockClient._mocks.insert.mockReturnValue({
        select: mockClient._mocks.select,
      });
      mockClient.from.mockReturnValue({
        insert: mockClient._mocks.insert,
      });

      const result = await service.createUpload(uploadData);

      expect(result).toEqual(mockResponse);
      expect(mockClient.from).toHaveBeenCalledWith('uploads');
      expect(mockClient._mocks.insert).toHaveBeenCalledWith([uploadData]);
    });

    it('should throw DatabaseError on insert error', async () => {
      const uploadData: UploadRecord = {
        filename: 'test.csv',
        original_filename: 'test.csv',
        file_path: '/uploads/test.csv',
        file_size: 1000,
        mimetype: 'text/csv',
        status: 'processing',
        total_rows: 10,
        valid_rows: 8,
        invalid_rows: 2,
        total_warnings: 0,
      };

      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });
      mockClient._mocks.select.mockReturnValue({
        single: mockClient._mocks.single,
      });
      mockClient._mocks.insert.mockReturnValue({
        select: mockClient._mocks.select,
      });
      mockClient.from.mockReturnValue({
        insert: mockClient._mocks.insert,
      });

      await expect(service.createUpload(uploadData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('createTransactions', () => {
    it('should create multiple transaction records', async () => {
      const transactions: TransactionRecord[] = [
        {
          upload_id: 'upload-123',
          row_number: 1,
          date: '2024-01-15',
          amount: 100,
          category: 'Food',
          is_valid: true,
          has_warnings: false,
          raw_data: {},
        },
        {
          upload_id: 'upload-123',
          row_number: 2,
          date: '2024-01-16',
          amount: 200,
          category: 'Transport',
          is_valid: true,
          has_warnings: false,
          raw_data: {},
        },
      ];

      const mockResponse = transactions.map((t, i) => ({ ...t, id: `txn-${i}` }));

      mockClient._mocks.select.mockResolvedValue({
        data: mockResponse,
        error: null,
      });
      mockClient._mocks.insert.mockReturnValue({
        select: mockClient._mocks.select,
      });
      mockClient.from.mockReturnValue({
        insert: mockClient._mocks.insert,
      });

      const result = await service.createTransactions(transactions);

      expect(result).toEqual(mockResponse);
      expect(mockClient.from).toHaveBeenCalledWith('transactions');
      expect(mockClient._mocks.insert).toHaveBeenCalledWith(transactions);
    });

    it('should handle batch insert errors', async () => {
      const transactions: TransactionRecord[] = [
        {
          upload_id: 'upload-123',
          row_number: 1,
          date: '2024-01-15',
          amount: 100,
          category: 'Food',
          is_valid: true,
          has_warnings: false,
          raw_data: {},
        },
      ];

      mockClient._mocks.select.mockResolvedValue({
        data: null,
        error: { message: 'Batch insert failed' },
      });
      mockClient._mocks.insert.mockReturnValue({
        select: mockClient._mocks.select,
      });
      mockClient.from.mockReturnValue({
        insert: mockClient._mocks.insert,
      });

      await expect(service.createTransactions(transactions)).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateUploadStatus', () => {
    it('should update upload status successfully', async () => {
      mockClient._mocks.eq.mockResolvedValue({
        data: null,
        error: null,
      });
      mockClient._mocks.update.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        update: mockClient._mocks.update,
      });

      await service.updateUploadStatus('upload-123', 'completed');

      expect(mockClient.from).toHaveBeenCalledWith('uploads');
      expect(mockClient._mocks.update).toHaveBeenCalledWith({
        status: 'completed',
      });
      expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'upload-123');
    });

    it('should update upload status with error message', async () => {
      mockClient._mocks.eq.mockResolvedValue({
        data: null,
        error: null,
      });
      mockClient._mocks.update.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        update: mockClient._mocks.update,
      });

      await service.updateUploadStatus(
        'upload-123',
        'failed',
        'Processing failed',
        { reason: 'Invalid data' }
      );

      expect(mockClient._mocks.update).toHaveBeenCalledWith({
        status: 'failed',
        error_message: 'Processing failed',
        error_details: { reason: 'Invalid data' },
      });
    });

    it('should throw DatabaseError on update error', async () => {
      mockClient._mocks.eq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      mockClient._mocks.update.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        update: mockClient._mocks.update,
      });

      await expect(
        service.updateUploadStatus('upload-123', 'completed')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('getUploadById', () => {
    it('should get upload by ID successfully', async () => {
      const mockUpload: UploadRecord = {
        id: 'upload-123',
        filename: 'test.csv',
        original_filename: 'test.csv',
        file_path: '/uploads/test.csv',
        file_size: 1000,
        mimetype: 'text/csv',
        status: 'completed',
        total_rows: 10,
        valid_rows: 8,
        invalid_rows: 2,
        total_warnings: 0,
      };

      mockClient._mocks.single.mockResolvedValue({
        data: mockUpload,
        error: null,
      });
      mockClient._mocks.is.mockReturnValue({
        single: mockClient._mocks.single,
      });
      mockClient._mocks.eq.mockReturnValue({
        is: mockClient._mocks.is,
      });
      mockClient._mocks.select.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        select: mockClient._mocks.select,
      });

      const result = await service.getUploadById('upload-123');

      expect(result).toEqual(mockUpload);
      expect(mockClient.from).toHaveBeenCalledWith('uploads');
      expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'upload-123');
    });

    it('should return null when upload not found', async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      mockClient._mocks.is.mockReturnValue({
        single: mockClient._mocks.single,
      });
      mockClient._mocks.eq.mockReturnValue({
        is: mockClient._mocks.is,
      });
      mockClient._mocks.select.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        select: mockClient._mocks.select,
      });

      const result = await service.getUploadById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on query error', async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });
      mockClient._mocks.is.mockReturnValue({
        single: mockClient._mocks.single,
      });
      mockClient._mocks.eq.mockReturnValue({
        is: mockClient._mocks.is,
      });
      mockClient._mocks.select.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        select: mockClient._mocks.select,
      });

      await expect(service.getUploadById('upload-123')).rejects.toThrow(DatabaseError);
    });
  });

  describe('getTransactionsByUploadId', () => {
    it('should get transactions by upload ID', async () => {
      const mockTransactions: TransactionRecord[] = [
        {
          id: 'txn-1',
          upload_id: 'upload-123',
          row_number: 1,
          date: '2024-01-15',
          amount: 100,
          category: 'Food',
          is_valid: true,
          has_warnings: false,
          raw_data: {},
        },
        {
          id: 'txn-2',
          upload_id: 'upload-123',
          row_number: 2,
          date: '2024-01-16',
          amount: 200,
          category: 'Transport',
          is_valid: true,
          has_warnings: false,
          raw_data: {},
        },
      ];

      mockClient._mocks.order.mockResolvedValue({
        data: mockTransactions,
        error: null,
      });
      mockClient._mocks.is.mockReturnValue({
        order: mockClient._mocks.order,
      });
      mockClient._mocks.eq.mockReturnValue({
        is: mockClient._mocks.is,
      });
      mockClient._mocks.select.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        select: mockClient._mocks.select,
      });

      const result = await service.getTransactionsByUploadId('upload-123');

      expect(result).toEqual(mockTransactions);
      expect(mockClient.from).toHaveBeenCalledWith('transactions');
      expect(mockClient._mocks.eq).toHaveBeenCalledWith('upload_id', 'upload-123');
      expect(mockClient._mocks.order).toHaveBeenCalledWith('row_number', { ascending: true });
    });

    it('should return empty array when no transactions found', async () => {
      mockClient._mocks.order.mockResolvedValue({
        data: [],
        error: null,
      });
      mockClient._mocks.is.mockReturnValue({
        order: mockClient._mocks.order,
      });
      mockClient._mocks.eq.mockReturnValue({
        is: mockClient._mocks.is,
      });
      mockClient._mocks.select.mockReturnValue({
        eq: mockClient._mocks.eq,
      });
      mockClient.from.mockReturnValue({
        select: mockClient._mocks.select,
      });

      const result = await service.getTransactionsByUploadId('upload-123');

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle foreign key constraint violation', async () => {
      mockClient._mocks.select.mockResolvedValue({
        data: null,
        error: { code: '23503', message: 'Foreign key violation' },
      });
      mockClient._mocks.insert.mockReturnValue({
        select: mockClient._mocks.select,
      });
      mockClient.from.mockReturnValue({
        insert: mockClient._mocks.insert,
      });

      await expect(
        service.createTransactions([
          {
            upload_id: 'nonexistent',
            row_number: 1,
            date: '2024-01-15',
            amount: 100,
            category: 'Food',
            is_valid: true,
            has_warnings: false,
            raw_data: {},
          },
        ])
      ).rejects.toThrow(DatabaseError);
    });

    it('should handle unique constraint violation', async () => {
      mockClient._mocks.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique violation' },
      });
      mockClient._mocks.select.mockReturnValue({
        single: mockClient._mocks.single,
      });
      mockClient._mocks.insert.mockReturnValue({
        select: mockClient._mocks.select,
      });
      mockClient.from.mockReturnValue({
        insert: mockClient._mocks.insert,
      });

      await expect(
        service.createUpload({
          filename: 'test.csv',
          original_filename: 'test.csv',
          file_path: '/uploads/test.csv',
          file_size: 1000,
          mimetype: 'text/csv',
          status: 'processing',
          total_rows: 10,
          valid_rows: 8,
          invalid_rows: 2,
          total_warnings: 0,
        })
      ).rejects.toThrow(DatabaseError);
    });
  });
});
