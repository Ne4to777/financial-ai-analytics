/**
 * Error Handler Middleware
 * 
 * Global error handler for Fastify that catches all errors,
 * formats responses, and logs appropriately
 */

import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import {
  AppError,
  formatError,
  mapError,
  isOperationalError,
  HTTPStatus,
} from '../utils/errors';

/**
 * Check if running in production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Error handler middleware
 * 
 * @param error - The error that occurred
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Convert to AppError if needed
  const appError = error instanceof AppError ? error : mapError(error);

  // Determine status code
  const statusCode = appError.statusCode || HTTPStatus.INTERNAL_SERVER_ERROR;

  // Log error
  logError(error, appError, request);

  // Format response based on environment
  const response = formatErrorResponse(appError, error);

  // Send response
  reply.status(statusCode).send(response);
}

/**
 * Log error with appropriate level
 */
function logError(
  originalError: Error,
  appError: AppError,
  request: FastifyRequest
): void {
  const isOperational = isOperationalError(appError);
  const logLevel = determineLogLevel(appError.statusCode, isOperational);

  const logData: Record<string, unknown> = {
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      isOperational,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: sanitizeHeaders(request.headers),
    },
  };

  // Add body if present
  if (request.body) {
    (logData.request as Record<string, unknown>).body = sanitizeBody(request.body);
  }

  // Add details if present
  if (appError.details) {
    logData.details = appError.details;
  }

  // Add stack if not production
  if (originalError.stack && !isProduction()) {
    logData.stack = originalError.stack;
  }

  switch (logLevel) {
    case 'error':
      request.log.error(logData, appError.message);
      break;
    case 'warn':
      request.log.warn(logData, appError.message);
      break;
    case 'info':
      request.log.info(logData, appError.message);
      break;
    default:
      request.log.debug(logData, appError.message);
  }
}

/**
 * Determine appropriate log level based on error
 */
function determineLogLevel(
  statusCode: number,
  isOperational: boolean
): 'error' | 'warn' | 'info' | 'debug' {
  // Programmer errors (non-operational) are always errors
  if (!isOperational) {
    return 'error';
  }

  // Map status codes to log levels
  if (statusCode >= 500) {
    return 'error';
  } else if (statusCode >= 400) {
    return 'warn';
  } else if (statusCode >= 300) {
    return 'info';
  }

  return 'debug';
}

/**
 * Format error response based on environment
 */
function formatErrorResponse(appError: AppError, originalError: Error) {
  if (isProduction()) {
    // Production: Hide internal errors
    if (!isOperationalError(appError)) {
      return {
        success: false,
        error: {
          code: appError.code,
          message: 'An unexpected error occurred',
          timestamp: appError.timestamp,
        },
      };
    }

    // Return error without stack trace
    return {
      success: false,
      ...formatError(appError),
    };
  }

  // Development: Include full error details
  const response: Record<string, unknown> = {
    success: false,
    ...formatError(appError),
  };

  // Add stack trace in development
  if (originalError.stack) {
    const errorData = response.error as Record<string, unknown>;
    errorData.stack = originalError.stack;
  }

  return response;
}

/**
 * Sanitize headers (remove sensitive data)
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...headers };
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
  ];

  sensitiveHeaders.forEach((header) => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Sanitize body (remove sensitive data)
 */
function sanitizeBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized = { ...body } as Record<string, unknown>;
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'creditCard',
    'ssn',
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Not found handler (404)
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.warn({
    msg: 'Route not found',
    method: request.method,
    url: request.url,
  });

  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
      timestamp: new Date().toISOString(),
    },
  });
}
