import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { createServer } from '../../src/server';
import { FastifyInstance } from 'fastify';

describe('Upload API Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/upload', () => {
    it('should successfully upload and process valid CSV file', async () => {
      const csvFilePath = path.join(__dirname, '../fixtures/valid.csv');
      const csvContent = await fs.readFile(csvFilePath);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: Buffer.concat([
          Buffer.from(
            '------WebKitFormBoundary\r\n' +
              'Content-Disposition: form-data; name="file"; filename="valid.csv"\r\n' +
              'Content-Type: text/csv\r\n\r\n'
          ),
          csvContent,
          Buffer.from('\r\n------WebKitFormBoundary--\r\n'),
        ]),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('successfully');
      expect(body.data).toBeDefined();
      expect(body.data.uploadId).toBeDefined();
      expect(body.data.file).toBeDefined();
      expect(body.data.file.size).toBeGreaterThan(0);
      expect(body.data.csv).toBeDefined();
      expect(body.data.csv.totalRows).toBe(5);
      expect(body.data.csv.columns).toEqual(['date', 'amount', 'category', 'description']);
      expect(body.data.preview).toHaveLength(5);
      expect(body.data.statistics).toBeDefined();
      expect(body.data.statistics.totalRows).toBe(5);
      expect(body.data.processingTime).toBeGreaterThan(0);
    });

    it('should reject file without required columns', async () => {
      const csvFilePath = path.join(__dirname, '../fixtures/missing-columns.csv');
      const csvContent = await fs.readFile(csvFilePath);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: Buffer.concat([
          Buffer.from(
            '------WebKitFormBoundary\r\n' +
              'Content-Disposition: form-data; name="file"; filename="missing-columns.csv"\r\n' +
              'Content-Type: text/csv\r\n\r\n'
          ),
          csvContent,
          Buffer.from('\r\n------WebKitFormBoundary--\r\n'),
        ]),
      });

      expect(response.statusCode).toBe(422);

      if (response.body) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('MISSING_REQUIRED_COLUMNS');
        expect(body.error.message).toContain('category');
      }
    });

    it('should reject malformed CSV file', async () => {
      const csvFilePath = path.join(__dirname, '../fixtures/malformed.csv');
      const csvContent = await fs.readFile(csvFilePath);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: Buffer.concat([
          Buffer.from(
            '------WebKitFormBoundary\r\n' +
              'Content-Disposition: form-data; name="file"; filename="malformed.csv"\r\n' +
              'Content-Type: text/csv\r\n\r\n'
          ),
          csvContent,
          Buffer.from('\r\n------WebKitFormBoundary--\r\n'),
        ]),
      });

      expect(response.statusCode).toBe(422);

      if (response.body) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('CSV_PARSE_ERROR');
      }
    });

    it('should reject empty CSV file', async () => {
      const csvFilePath = path.join(__dirname, '../fixtures/empty.csv');
      const csvContent = await fs.readFile(csvFilePath);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: Buffer.concat([
          Buffer.from(
            '------WebKitFormBoundary\r\n' +
              'Content-Disposition: form-data; name="file"; filename="empty.csv"\r\n' +
              'Content-Type: text/csv\r\n\r\n'
          ),
          csvContent,
          Buffer.from('\r\n------WebKitFormBoundary--\r\n'),
        ]),
      });

      expect(response.statusCode).toBe(422);

      if (response.body) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('CSV_PARSE_ERROR');
      }
    });

    it('should reject non-CSV file type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: Buffer.concat([
          Buffer.from(
            '------WebKitFormBoundary\r\n' +
              'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n' +
              'Content-Type: text/plain\r\n\r\n'
          ),
          Buffer.from('This is a text file, not CSV'),
          Buffer.from('\r\n------WebKitFormBoundary--\r\n'),
        ]),
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_EXTENSION');
    });

    it('should handle CSV with empty lines correctly', async () => {
      const csvFilePath = path.join(__dirname, '../fixtures/with-empty-lines.csv');
      const csvContent = await fs.readFile(csvFilePath);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: Buffer.concat([
          Buffer.from(
            '------WebKitFormBoundary\r\n' +
              'Content-Disposition: form-data; name="file"; filename="with-empty-lines.csv"\r\n' +
              'Content-Type: text/csv\r\n\r\n'
          ),
          csvContent,
          Buffer.from('\r\n------WebKitFormBoundary--\r\n'),
        ]),
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.csv.totalRows).toBe(2); // Empty lines skipped
    });
  });

  describe('GET /health', () => {
    it('should return health check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });
  });
});
