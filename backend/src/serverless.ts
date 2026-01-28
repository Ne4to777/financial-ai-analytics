/**
 * Vercel Serverless Entry Point
 * 
 * This file adapts our Fastify app to work as a Vercel serverless function.
 */

import { fastify, FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import routes and middleware
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Cached app instance (singleton for serverless)
let cachedApp: FastifyInstance | null = null;

/**
 * Create and configure Fastify app
 */
async function createApp(): Promise<FastifyInstance> {
  // Environment variables validation
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  }

  // Create Fastify instance for serverless
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: false,
        },
      } : undefined,
    },
    // Disable request timeout for serverless
    requestTimeout: 0,
    // Trust proxy for Vercel
    trustProxy: true,
  });

  // Register CORS
  await app.register(cors, {
    origin: true, // Allow all origins (configure as needed for production)
    credentials: true,
  });

  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 1000000,
      fields: 10,
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
      headerPairs: 2000,
    },
  });

  // Register Swagger for API documentation
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'CSV Processing API',
        description: 'Upload and validate CSV transaction files with intelligent error detection',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://your-project.vercel.app',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Upload', description: 'CSV file upload and processing' },
      ],
    },
  });

  // Register Swagger UI
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Root endpoint
  app.get('/', {
    schema: {
      description: 'API information',
      tags: ['Health'],
      response: {
        200: {
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
  }, async () => {
    return {
      name: 'CSV Processing API',
      version: '1.0.0',
      description: 'Upload and validate CSV transaction files',
      endpoints: {
        health: 'GET /health',
        upload: 'POST /upload',
        docs: 'GET /docs',
      },
    };
  });

  // Health check endpoint
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            environment: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  });

  // Register upload routes
  await app.register(uploadRoutes);

  // Register error handlers
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // Ready the app
  await app.ready();

  return app;
}

/**
 * Get or create Fastify app (singleton)
 */
async function getApp(): Promise<FastifyInstance> {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp;
}

/**
 * Vercel serverless handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    app.server.emit('request', req, res);
  } catch (error) {
    console.error('Error initializing app:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Export createApp for direct usage if needed
export { createApp, getApp };
