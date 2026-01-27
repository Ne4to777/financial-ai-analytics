import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validateFileMetadata } from '../validators/file.validator';

/**
 * File upload route handler
 */
async function uploadHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Extract file from multipart request
    const file = await request.file();

    // Validate file metadata (extension and MIME type)
    const validationResult = validateFileMetadata(file);

    if (!validationResult.valid) {
      request.log.warn({
        msg: 'File validation failed',
        errors: validationResult.errors,
      });

      // Return first validation error
      const firstError = validationResult.errors[0];
      const statusCode = firstError?.code === 'FILE_TOO_LARGE' ? 413 : 
                        firstError?.code === 'INVALID_MIME_TYPE' ? 415 : 400;

      return reply.code(statusCode).send({
        success: false,
        error: {
          code: firstError?.code,
          message: firstError?.message,
          details: firstError?.details,
        },
        validationErrors: validationResult.errors,
      });
    }

    // Log file information
    request.log.info({
      msg: 'File received and validated',
      filename: file!.filename,
      mimetype: file!.mimetype,
      encoding: file!.encoding,
      fieldname: file!.fieldname,
    });

    // Extract file metadata
    const fileMetadata = {
      filename: file!.filename,
      mimetype: file!.mimetype,
      encoding: file!.encoding,
      size: 0, // Will be calculated during processing
    };

    // For now, just return metadata without processing
    // (File processing will be added in Task 1.3-1.6)
    return reply.code(200).send({
      success: true,
      message: 'File received and validated successfully',
      data: {
        file: fileMetadata,
        receivedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error({ err: error }, 'Error handling file upload');

    return reply.code(500).send({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'An error occurred while processing the file upload',
      },
    });
  }
}

/**
 * Register upload routes
 */
export default async function uploadRoutes(fastify: FastifyInstance) {
  // POST /api/upload - Upload CSV file
  fastify.post('/api/upload', {
    schema: {
      description: 'Upload a CSV file for processing',
      tags: ['upload'],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          description: 'File uploaded successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                file: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    mimetype: { type: 'string' },
                    encoding: { type: 'string' },
                    size: { type: 'number' },
                  },
                },
                receivedAt: { type: 'string' },
              },
            },
          },
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, uploadHandler);
}
