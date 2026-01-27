import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { errorHandler, notFoundHandler } from '../../src/middleware/error.middleware';
import { AppError, FileError, ValidationError, AppErrorCode, HTTPStatus } from '../../src/utils/errors';

// Helper to create mock request
function createMockRequest(overrides = {}) {
  return {
    log: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
    method: 'POST',
    url: '/api/test',
    headers: {},
    body: {},
    ...overrides,
  } as unknown as FastifyRequest;
}

// Helper to create mock reply
function createMockReply() {
  const reply = {
    status: vi.fn(),
    send: vi.fn(),
  } as unknown as FastifyReply;

  (reply.status as any).mockReturnValue(reply);
  return reply;
}

describe('Error Middleware', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('errorHandler', () => {
    it('should handle AppError', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError('Test error', AppErrorCode.VALIDATION_FAILED, 400);

      await errorHandler(error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: AppErrorCode.VALIDATION_FAILED,
            message: 'Test error',
          }),
        })
      );
    });

    it('should map generic Error to AppError', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new Error('Generic error');

      await errorHandler(error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Generic error',
          }),
        })
      );
    });

    it('should handle FileError', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = FileError.fileTooLarge(1000, 2000);

      await errorHandler(error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: AppErrorCode.FILE_TOO_LARGE,
          }),
        })
      );
    });

    it('should handle ValidationError', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = ValidationError.singleField('email', 'Invalid email');

      await errorHandler(error, request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: AppErrorCode.VALIDATION_FAILED,
            errors: expect.arrayContaining([
              expect.objectContaining({ field: 'email' }),
            ]),
          }),
        })
      );
    });

    it('should log error with warn level for 4xx', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError('Client error', AppErrorCode.VALIDATION_FAILED, 400);

      await errorHandler(error, request, reply);

      expect(request.log.warn).toHaveBeenCalled();
    });

    it('should log error with error level for 5xx', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError('Server error', AppErrorCode.INTERNAL_SERVER_ERROR, 500);

      await errorHandler(error, request, reply);

      expect(request.log.error).toHaveBeenCalled();
    });

    it('should log error level for non-operational errors', async () => {
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError(
        'Programmer error',
        AppErrorCode.INTERNAL_SERVER_ERROR,
        500,
        undefined,
        false // non-operational
      );

      await errorHandler(error, request, reply);

      expect(request.log.error).toHaveBeenCalled();
    });

    it('should include request details in log', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/upload',
        headers: { 'content-type': 'application/json' },
        body: { data: 'test' },
      });
      const reply = createMockReply();
      const error = new AppError('Test error');

      await errorHandler(error, request, reply);

      const logCall = request.log.error as any;
      expect(logCall).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            method: 'POST',
            url: '/api/upload',
          }),
        }),
        'Test error'
      );
    });

    it('should sanitize sensitive headers', async () => {
      const request = createMockRequest({
        headers: {
          authorization: 'Bearer secret-token',
          'content-type': 'application/json',
        },
      });
      const reply = createMockReply();
      const error = new AppError('Test error');

      await errorHandler(error, request, reply);

      const logCall = request.log.error as any;
      expect(logCall).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            headers: expect.objectContaining({
              authorization: '[REDACTED]',
            }),
          }),
        }),
        'Test error'
      );
    });

    it('should sanitize sensitive body fields', async () => {
      const request = createMockRequest({
        body: {
          username: 'john',
          password: 'secret123',
        },
      });
      const reply = createMockReply();
      const error = new AppError('Test error');

      await errorHandler(error, request, reply);

      const logCall = request.log.error as any;
      expect(logCall).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            body: expect.objectContaining({
              password: '[REDACTED]',
            }),
          }),
        }),
        'Test error'
      );
    });

    it('should hide internal errors in production', async () => {
      process.env.NODE_ENV = 'production';
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError(
        'Internal error',
        AppErrorCode.INTERNAL_SERVER_ERROR,
        500,
        undefined,
        false // non-operational
      );

      await errorHandler(error, request, reply);

      const sendCall = reply.send as any;
      const response = sendCall.mock.calls[0][0];
      expect(response.error.message).toBe('An unexpected error occurred');
      expect(response.error.message).not.toBe('Internal error');
    });

    it('should include operational errors in production', async () => {
      process.env.NODE_ENV = 'production';
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError(
        'Validation failed',
        AppErrorCode.VALIDATION_FAILED,
        400,
        undefined,
        true // operational
      );

      await errorHandler(error, request, reply);

      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Validation failed',
          }),
        })
      );
    });

    it('should include stack trace in development', async () => {
      process.env.NODE_ENV = 'development';
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new Error('Test error with stack');

      await errorHandler(error, request, reply);

      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String),
          }),
        })
      );
    });

    it('should not include stack trace in production', async () => {
      process.env.NODE_ENV = 'production';
      const request = createMockRequest();
      const reply = createMockReply();
      const error = new AppError('Test error', AppErrorCode.VALIDATION_FAILED, 400);

      await errorHandler(error, request, reply);

      const sendCall = reply.send as any;
      const response = sendCall.mock.calls[0][0];
      expect(response.error.stack).toBeUndefined();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for missing routes', () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/nonexistent',
      });
      const reply = createMockReply();

      notFoundHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            message: expect.stringContaining('/api/nonexistent'),
          }),
        })
      );
    });

    it('should log warning for not found routes', () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/missing',
      });
      const reply = createMockReply();

      notFoundHandler(request, reply);

      expect(request.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Route not found',
          method: 'POST',
          url: '/api/missing',
        })
      );
    });
  });
});
