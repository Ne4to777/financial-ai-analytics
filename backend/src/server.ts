import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

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

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      name: 'CSV Processing API',
      version: '1.0.0',
      description: 'Upload, parse, validate, and store CSV files',
      endpoints: {
        health: 'GET /health',
        upload: 'POST /api/upload',
      },
    };
  });

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

// Start server if running directly
if (require.main === module) {
  start();
}

export { createServer, start };
