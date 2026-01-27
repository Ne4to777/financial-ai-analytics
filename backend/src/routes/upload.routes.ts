import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { validateFileMetadata } from '../validators/file.validator';
import { storageService } from '../services/storage.service';
import { csvService } from '../services/csv.service';
import {
  UploadSuccessResponse,
  UploadErrorResponse,
  APIErrorCode,
  HTTPStatusCode,
  REQUIRED_COLUMNS,
} from '../types';

/**
 * File upload route handler
 */
async function uploadHandler(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now();
  let savedFilePath: string | undefined;

  try {
    // Step 1: Extract file from multipart request
    const file = await request.file();

    // Step 2: Validate file metadata (extension and MIME type)
    const validationResult = validateFileMetadata(file);

    if (!validationResult.valid) {
      request.log.warn({
        msg: 'File validation failed',
        errors: validationResult.errors,
      });

      const firstError = validationResult.errors[0];
      const statusCode =
        firstError?.code === 'FILE_TOO_LARGE'
          ? HTTPStatusCode.PAYLOAD_TOO_LARGE
          : firstError?.code === 'INVALID_MIME_TYPE'
          ? HTTPStatusCode.UNSUPPORTED_MEDIA_TYPE
          : HTTPStatusCode.BAD_REQUEST;

      const errorResponse: UploadErrorResponse = {
        success: false,
        error: {
          code: firstError?.code || APIErrorCode.VALIDATION_ERROR,
          message: firstError?.message || 'File validation failed',
          details: firstError?.details,
        },
        validationErrors: validationResult.errors.map((err) => ({
          code: err.code,
          message: err.message,
        })),
      };

      return reply.code(statusCode).send(errorResponse);
    }

    request.log.info({
      msg: 'File validated successfully',
      filename: file!.filename,
      mimetype: file!.mimetype,
    });

    // Step 3: Save file to storage
    let storedFile;
    try {
      storedFile = await storageService.saveFile(file!.file, file!.filename);
      savedFilePath = storedFile.path;

      request.log.info({
        msg: 'File saved to storage',
        filename: storedFile.filename,
        size: storedFile.size,
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to save file');

      const errorResponse: UploadErrorResponse = {
        success: false,
        error: {
          code: APIErrorCode.STORAGE_ERROR,
          message: 'Failed to save uploaded file',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      };

      return reply.code(HTTPStatusCode.INTERNAL_SERVER_ERROR).send(errorResponse);
    }

    // Step 4: Parse CSV file
    let parsedCSV;
    try {
      parsedCSV = await csvService.parseFile(storedFile.path);

      request.log.info({
        msg: 'CSV parsed successfully',
        rows: parsedCSV.totalRows,
        columns: parsedCSV.columns.length,
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to parse CSV');

      // Clean up saved file
      try {
        await storageService.deleteFile(storedFile.filename);
      } catch {
        // Ignore cleanup errors
      }

      const errorResponse: UploadErrorResponse = {
        success: false,
        error: {
          code: APIErrorCode.CSV_PARSE_ERROR,
          message: 'Failed to parse CSV file',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      };

      return reply.code(HTTPStatusCode.UNPROCESSABLE_ENTITY).send(errorResponse);
    }

    // Step 5: Validate CSV columns
    const columnValidation = csvService.validateColumns(
      parsedCSV,
      [...REQUIRED_COLUMNS] // Convert readonly array to mutable array
    );

    if (!columnValidation.valid) {
      request.log.warn({
        msg: 'CSV column validation failed',
        missingColumns: columnValidation.missingColumns,
      });

      // Clean up saved file
      try {
        await storageService.deleteFile(storedFile.filename);
      } catch {
        // Ignore cleanup errors
      }

      const errorResponse: UploadErrorResponse = {
        success: false,
        error: {
          code: APIErrorCode.MISSING_REQUIRED_COLUMNS,
          message: `Missing required columns: ${columnValidation.missingColumns.join(', ')}`,
          details: {
            required: REQUIRED_COLUMNS,
            found: parsedCSV.columns,
            missing: columnValidation.missingColumns,
          },
        },
      };

      return reply.code(HTTPStatusCode.UNPROCESSABLE_ENTITY).send(errorResponse);
    }

    // Step 6: Get CSV statistics
    const stats = csvService.getStats(parsedCSV);

    // Step 7: Build success response
    const uploadId = uuidv4();
    const processingTime = Date.now() - startTime;

    const successResponse: UploadSuccessResponse = {
      success: true,
      message: 'CSV file uploaded and processed successfully',
      data: {
        uploadId,
        file: {
          filename: storedFile.filename,
          mimetype: file!.mimetype,
          encoding: file!.encoding,
          size: storedFile.size,
        },
        csv: {
          totalRows: parsedCSV.totalRows,
          totalColumns: parsedCSV.columns.length,
          columns: parsedCSV.columns,
          delimiter: parsedCSV.meta.delimiter,
          linebreak: parsedCSV.meta.linebreak,
          hasErrors: parsedCSV.errors.length > 0,
          errorCount: parsedCSV.errors.length,
        },
        preview: parsedCSV.rows.slice(0, 5), // First 5 rows
        statistics: {
          totalRows: stats.totalRows,
          validRows: stats.totalRows, // TODO: Add validation in Phase 2
          invalidRows: 0, // TODO: Add validation in Phase 2
          warnings: parsedCSV.errors.length,
        },
        receivedAt: new Date().toISOString(),
        processingTime,
      },
    };

    request.log.info({
      msg: 'Upload completed successfully',
      uploadId,
      rows: parsedCSV.totalRows,
      processingTime,
    });

    return reply.code(HTTPStatusCode.OK).send(successResponse);
  } catch (error) {
    request.log.error({ err: error }, 'Unexpected error during upload');

    // Clean up saved file if exists
    if (savedFilePath) {
      try {
        const filename = savedFilePath.split('/').pop();
        if (filename) {
          await storageService.deleteFile(filename);
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    const errorResponse: UploadErrorResponse = {
      success: false,
      error: {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred while processing the upload',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    };

    return reply.code(HTTPStatusCode.INTERNAL_SERVER_ERROR).send(errorResponse);
  }
}

/**
 * Register upload routes
 */
export default async function uploadRoutes(fastify: FastifyInstance) {
  // POST /api/upload - Upload CSV file
  fastify.post(
    '/api/upload',
    {
      schema: {
        description: 'Upload and process a CSV file',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            description: 'File uploaded and processed successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  uploadId: { type: 'string' },
                  file: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string' },
                      mimetype: { type: 'string' },
                      encoding: { type: 'string' },
                      size: { type: 'number' },
                    },
                  },
                  csv: {
                    type: 'object',
                    properties: {
                      totalRows: { type: 'number' },
                      totalColumns: { type: 'number' },
                      columns: { type: 'array', items: { type: 'string' } },
                      delimiter: { type: 'string' },
                      linebreak: { type: 'string' },
                      hasErrors: { type: 'boolean' },
                      errorCount: { type: 'number' },
                    },
                  },
                  preview: {
                    type: 'array',
                    items: { type: 'object' },
                  },
                  statistics: {
                    type: 'object',
                    properties: {
                      totalRows: { type: 'number' },
                      validRows: { type: 'number' },
                      invalidRows: { type: 'number' },
                      warnings: { type: 'number' },
                    },
                  },
                  receivedAt: { type: 'string' },
                  processingTime: { type: 'number' },
                },
              },
            },
          },
          400: {
            description: 'Bad request (validation error)',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'object' },
                },
              },
              validationErrors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          413: {
            description: 'Payload too large',
            type: 'object',
          },
          415: {
            description: 'Unsupported media type',
            type: 'object',
          },
          422: {
            description: 'Unprocessable entity (CSV parsing/validation error)',
            type: 'object',
          },
          500: {
            description: 'Internal server error',
            type: 'object',
          },
        },
      },
    },
    uploadHandler
  );
}
