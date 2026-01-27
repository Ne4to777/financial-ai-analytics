import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  WRITE_ERROR = 'WRITE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  DISK_FULL_ERROR = 'DISK_FULL_ERROR',
  INVALID_PATH = 'INVALID_PATH',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
}

/**
 * Storage error
 */
export class StorageError extends Error {
  constructor(
    public code: StorageErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Stored file metadata
 */
export interface StoredFile {
  filename: string;
  originalFilename: string;
  path: string;
  size: number;
  savedAt: Date;
}

/**
 * Storage service configuration
 */
export interface StorageConfig {
  uploadsDir: string;
  maxRetries: number;
}

/**
 * Default storage configuration
 */
const DEFAULT_CONFIG: StorageConfig = {
  uploadsDir: path.join(process.cwd(), 'uploads'),
  maxRetries: 3,
};

/**
 * Storage service for managing file uploads
 */
export class StorageService {
  private config: StorageConfig;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate unique filename with UUID and timestamp
   */
  generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    
    // Sanitize basename (remove special characters)
    const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${sanitized}_${timestamp}_${uuid}${ext}`;
  }

  /**
   * Ensure uploads directory exists
   */
  async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(this.config.uploadsDir);
    } catch {
      // Directory doesn't exist, create it
      try {
        await fs.mkdir(this.config.uploadsDir, { recursive: true });
      } catch (error) {
        throw new StorageError(
          StorageErrorCode.PERMISSION_ERROR,
          'Failed to create uploads directory',
          {
            directory: this.config.uploadsDir,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    }
  }

  /**
   * Save file stream to disk
   * 
   * @param fileStream - Readable stream of file content
   * @param originalFilename - Original filename from upload
   * @returns Stored file metadata
   */
  async saveFile(
    fileStream: Readable,
    originalFilename: string
  ): Promise<StoredFile> {
    await this.ensureUploadsDir();

    const filename = this.generateUniqueFilename(originalFilename);
    const filePath = path.join(this.config.uploadsDir, filename);

    let size = 0;

    try {
      // Create write stream
      const writeStream = createWriteStream(filePath);

      // Track file size
      fileStream.on('data', (chunk: Buffer) => {
        size += chunk.length;
      });

      // Pipe file stream to disk
      await pipeline(fileStream, writeStream);

      return {
        filename,
        originalFilename,
        path: filePath,
        size,
        savedAt: new Date(),
      };
    } catch (error) {
      // Attempt to clean up partial file
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }

      // Determine error type
      if (error instanceof Error) {
        if (error.message.includes('ENOSPC')) {
          throw new StorageError(
            StorageErrorCode.DISK_FULL_ERROR,
            'Disk is full, unable to save file',
            { filename: originalFilename, error: error.message }
          );
        }

        if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
          throw new StorageError(
            StorageErrorCode.PERMISSION_ERROR,
            'Permission denied while writing file',
            { filename: originalFilename, error: error.message }
          );
        }
      }

      throw new StorageError(
        StorageErrorCode.WRITE_ERROR,
        'Failed to save file',
        {
          filename: originalFilename,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Delete a file from storage
   * 
   * @param filename - Name of file to delete
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.config.uploadsDir, filename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new StorageError(
          StorageErrorCode.FILE_NOT_FOUND,
          'File not found',
          { filename }
        );
      }

      throw new StorageError(
        StorageErrorCode.WRITE_ERROR,
        'Failed to delete file',
        {
          filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Get file metadata
   * 
   * @param filename - Name of file
   */
  async getFileMetadata(filename: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
  }> {
    const filePath = path.join(this.config.uploadsDir, filename);

    try {
      const stats = await fs.stat(filePath);

      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new StorageError(
          StorageErrorCode.FILE_NOT_FOUND,
          'File not found',
          { filename }
        );
      }

      throw new StorageError(
        StorageErrorCode.WRITE_ERROR,
        'Failed to get file metadata',
        {
          filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Clean up old files
   * Deletes files older than specified age
   * 
   * @param maxAgeMs - Maximum age in milliseconds
   * @returns Number of files deleted
   */
  async cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      await this.ensureUploadsDir();

      const files = await fs.readdir(this.config.uploadsDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        // Skip README.md and other non-uploaded files
        if (file === 'README.md' || file.startsWith('.')) {
          continue;
        }

        const filePath = path.join(this.config.uploadsDir, file);

        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch (error) {
          // Skip files that cause errors (already deleted, permission issues, etc.)
          continue;
        }
      }

      return deletedCount;
    } catch (error) {
      throw new StorageError(
        StorageErrorCode.WRITE_ERROR,
        'Failed to clean up old files',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * List all files in storage
   * 
   * @returns Array of filenames
   */
  async listFiles(): Promise<string[]> {
    try {
      await this.ensureUploadsDir();

      const files = await fs.readdir(this.config.uploadsDir);

      // Filter out README.md and hidden files
      return files.filter(
        (file) => file !== 'README.md' && !file.startsWith('.')
      );
    } catch (error) {
      throw new StorageError(
        StorageErrorCode.WRITE_ERROR,
        'Failed to list files',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    const files = await this.listFiles();
    let totalSize = 0;

    for (const file of files) {
      try {
        const metadata = await this.getFileMetadata(file);
        totalSize += metadata.size;
      } catch {
        // Skip files that cause errors
        continue;
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
    };
  }
}

// Export singleton instance
export const storageService = new StorageService();
