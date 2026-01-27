import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

/**
 * File upload route handler
 */
async function uploadHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Extract file from multipart request
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded. Please include a file in the request.',
        },
      });
    }

    // Extract file metadata
    const file: MultipartFile = data;
    const fileMetadata = {
      filename: file.filename,
      mimetype: file.mimetype,
      encoding: file.encoding,
      size: 0, // Will be calculated if needed
    };

    // Log file information
    request.log.info({
      msg: 'File received',
      filename: file.filename,
      mimetype: file.mimetype,
      encoding: file.encoding,
      fieldname: file.fieldname,
    });

    // For now, just return metadata without processing
    // (File processing will be added in Task 1.3-1.6)
    return reply.code(200).send({
      success: true,
      message: 'File received successfully',
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
