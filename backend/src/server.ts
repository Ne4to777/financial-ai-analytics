import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Create and configure Fastify server
 */
async function createServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register Swagger for API documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'CSV Processing API',
        description: 'Upload, parse, validate, and store CSV transaction files',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'upload', description: 'File upload operations' },
        { name: 'health', description: 'Health check operations' },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'apiKey',
            in: 'header',
          },
        },
      },
    },
  });

  // Register CORS plugin (allow all origins for MVP)
  await fastify.register(cors, {
    origin: true, // Allow all origins
    credentials: true,
  });

  // Register multipart plugin for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1, // Max 1 file per request
    },
  });

  // Register error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  // Register routes
  await fastify.register(uploadRoutes);

  // Register Swagger UI (must be after routes)
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Health check endpoint
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            description: 'Service is healthy',
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number', description: 'Server uptime in seconds' },
              environment: { type: 'string', example: 'development' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      };
    }
  );

  // Root endpoint
  fastify.get(
    '/',
    {
      schema: {
        description: 'API information endpoint',
        tags: ['info'],
        response: {
          200: {
            description: 'API information',
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              endpoints: {
                type: 'object',
                properties: {
                  health: { type: 'string' },
                  upload: { type: 'string' },
                  docs: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return {
        name: 'CSV Processing API',
        version: '1.0.0',
        description: 'Upload, parse, validate, and store CSV files',
        endpoints: {
          health: 'GET /health',
          upload: 'POST /upload',
          docs: 'GET /docs',
        },
      };
    }
  );

  return fastify;
}

/**
 * Start server
 */
async function start() {
  try {
    const fastify = await createServer();

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        fastify.log.info(`Received ${signal}, closing server gracefully...`);
        await fastify.close();
        process.exit(0);
      });
    });

    // Start listening
    await fastify.listen({ port: PORT, host: HOST });

    fastify.log.info(`🚀 Server ready at http://${HOST}:${PORT}`);
    fastify.log.info(`📊 Health check: http://${HOST}:${PORT}/health`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start server if running directly (ES Module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { createServer, start };
