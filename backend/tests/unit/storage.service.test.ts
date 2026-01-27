import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import {
  StorageService,
  StorageError,
  StorageErrorCode,
} from '../../src/services/storage.service';

const TEST_UPLOADS_DIR = path.join(process.cwd(), 'test-uploads');

/**
 * Create a readable stream from string content
 */
function createStream(content: string): Readable {
  return Readable.from([content]);
}

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService({
      uploadsDir: TEST_UPLOADS_DIR,
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      const files = await fs.readdir(TEST_UPLOADS_DIR);
      for (const file of files) {
        await fs.unlink(path.join(TEST_UPLOADS_DIR, file));
      }
      await fs.rmdir(TEST_UPLOADS_DIR);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename with UUID and timestamp', () => {
      const filename1 = storageService.generateUniqueFilename('test.csv');
      const filename2 = storageService.generateUniqueFilename('test.csv');

      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('test');
      expect(filename1).toMatch(/\.csv$/);
      expect(filename1).toMatch(/_\d+_/); // Contains timestamp
      expect(filename1).toMatch(/[a-f0-9-]{36}/); // Contains UUID
    });

    it('should preserve file extension', () => {
      const filename = storageService.generateUniqueFilename('data.csv');
      expect(filename).toMatch(/\.csv$/);
    });

    it('should sanitize special characters in filename', () => {
      const filename = storageService.generateUniqueFilename('test file@2024!.csv');
      expect(filename).toMatch(/^test_file_2024_/);
      expect(filename).not.toContain('@');
      expect(filename).not.toContain('!');
      expect(filename).not.toContain(' ');
    });

    it('should handle files with multiple dots', () => {
      const filename = storageService.generateUniqueFilename('my.test.file.csv');
      expect(filename).toMatch(/\.csv$/);
      expect(filename).toContain('my_test_file');
    });

    it('should handle files without extension', () => {
      const filename = storageService.generateUniqueFilename('testfile');
      expect(filename).toContain('testfile');
      expect(filename).toMatch(/_\d+_[a-f0-9-]{36}$/);
    });
  });

  describe('ensureUploadsDir', () => {
    it('should create uploads directory if it does not exist', async () => {
      await storageService.ensureUploadsDir();

      const exists = await fs
        .access(TEST_UPLOADS_DIR)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should not throw error if directory already exists', async () => {
      await fs.mkdir(TEST_UPLOADS_DIR, { recursive: true });

      await expect(storageService.ensureUploadsDir()).resolves.not.toThrow();
    });
  });

  describe('saveFile', () => {
    it('should save file and return metadata', async () => {
      const content = 'date,amount,category\n2024-01-15,1500.00,Salary';
      const stream = createStream(content);

      const result = await storageService.saveFile(stream, 'test.csv');

      expect(result.originalFilename).toBe('test.csv');
      expect(result.filename).toContain('test');
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.path).toContain(TEST_UPLOADS_DIR);
      expect(result.size).toBe(content.length);
      expect(result.savedAt).toBeInstanceOf(Date);

      // Verify file exists
      const fileContent = await fs.readFile(result.path, 'utf-8');
      expect(fileContent).toBe(content);
    });

    it('should create uploads directory if it does not exist', async () => {
      const content = 'test content';
      const stream = createStream(content);

      const result = await storageService.saveFile(stream, 'test.csv');

      expect(result.path).toContain(TEST_UPLOADS_DIR);

      const exists = await fs
        .access(TEST_UPLOADS_DIR)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should handle large file content', async () => {
      const largeContent = 'x'.repeat(1024 * 100); // 100KB
      const stream = createStream(largeContent);

      const result = await storageService.saveFile(stream, 'large.csv');

      expect(result.size).toBe(largeContent.length);
    });

    it('should generate unique filenames for multiple files', async () => {
      const stream1 = createStream('content 1');
      const stream2 = createStream('content 2');

      const result1 = await storageService.saveFile(stream1, 'test.csv');
      const result2 = await storageService.saveFile(stream2, 'test.csv');

      expect(result1.filename).not.toBe(result2.filename);
      expect(result1.path).not.toBe(result2.path);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const stream = createStream('test content');
      const saved = await storageService.saveFile(stream, 'test.csv');

      await storageService.deleteFile(saved.filename);

      const exists = await fs
        .access(saved.path)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(false);
    });

    it('should throw error if file does not exist', async () => {
      await expect(
        storageService.deleteFile('nonexistent.csv')
      ).rejects.toThrow(StorageError);

      await expect(
        storageService.deleteFile('nonexistent.csv')
      ).rejects.toMatchObject({
        code: StorageErrorCode.FILE_NOT_FOUND,
      });
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata', async () => {
      const content = 'test content';
      const stream = createStream(content);
      const saved = await storageService.saveFile(stream, 'test.csv');

      const metadata = await storageService.getFileMetadata(saved.filename);

      expect(metadata.size).toBe(content.length);
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.modifiedAt).toBeInstanceOf(Date);
    });

    it('should throw error if file does not exist', async () => {
      await expect(
        storageService.getFileMetadata('nonexistent.csv')
      ).rejects.toThrow(StorageError);

      await expect(
        storageService.getFileMetadata('nonexistent.csv')
      ).rejects.toMatchObject({
        code: StorageErrorCode.FILE_NOT_FOUND,
      });
    });
  });

  describe('listFiles', () => {
    it('should return empty array when no files exist', async () => {
      await storageService.ensureUploadsDir();

      const files = await storageService.listFiles();

      expect(files).toEqual([]);
    });

    it('should list all uploaded files', async () => {
      const stream1 = createStream('content 1');
      const stream2 = createStream('content 2');

      const saved1 = await storageService.saveFile(stream1, 'test1.csv');
      const saved2 = await storageService.saveFile(stream2, 'test2.csv');

      const files = await storageService.listFiles();

      expect(files).toHaveLength(2);
      expect(files).toContain(saved1.filename);
      expect(files).toContain(saved2.filename);
    });

    it('should exclude README.md from listing', async () => {
      await storageService.ensureUploadsDir();
      await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'README.md'), 'readme content');

      const stream = createStream('test content');
      await storageService.saveFile(stream, 'test.csv');

      const files = await storageService.listFiles();

      expect(files).not.toContain('README.md');
      expect(files).toHaveLength(1);
    });
  });

  describe('cleanupOldFiles', () => {
    it('should delete files older than specified age', async () => {
      const stream = createStream('old content');
      const saved = await storageService.saveFile(stream, 'old.csv');

      // Manually set file modification time to 2 days ago
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      await fs.utimes(saved.path, new Date(twoDaysAgo), new Date(twoDaysAgo));

      const deleted = await storageService.cleanupOldFiles(24 * 60 * 60 * 1000); // 1 day

      expect(deleted).toBe(1);

      const exists = await fs
        .access(saved.path)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(false);
    });

    it('should not delete recent files', async () => {
      const stream = createStream('recent content');
      const saved = await storageService.saveFile(stream, 'recent.csv');

      const deleted = await storageService.cleanupOldFiles(24 * 60 * 60 * 1000);

      expect(deleted).toBe(0);

      const exists = await fs
        .access(saved.path)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should not delete README.md', async () => {
      await storageService.ensureUploadsDir();
      const readmePath = path.join(TEST_UPLOADS_DIR, 'README.md');
      await fs.writeFile(readmePath, 'readme content');

      // Set to old date
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      await fs.utimes(readmePath, new Date(twoDaysAgo), new Date(twoDaysAgo));

      await storageService.cleanupOldFiles(24 * 60 * 60 * 1000);

      const exists = await fs
        .access(readmePath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no files exist', async () => {
      await storageService.ensureUploadsDir();

      const stats = await storageService.getStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should return correct stats for uploaded files', async () => {
      const content1 = 'content 1'; // 9 bytes
      const content2 = 'content 2 longer'; // 16 bytes
      const stream1 = createStream(content1);
      const stream2 = createStream(content2);

      await storageService.saveFile(stream1, 'test1.csv');
      await storageService.saveFile(stream2, 'test2.csv');

      const stats = await storageService.getStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(content1.length + content2.length);
    });
  });
});
