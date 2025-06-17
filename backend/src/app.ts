import cors from 'cors';
import 'reflect-metadata';
import express from 'express';
import { config } from './utils/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppDataSource } from './utils/database';
import { setupCache } from './utils/cache';
import { logger } from './logger';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: express.Express = express();
const PORT: number = Number(config.port) || 3000;

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TaskTphere Backend',
    version: '1.0.0',
  });
});

// API routes
app.use('/api', setupRoutes());

// Error handling middleware
app.use(errorHandler);

async function initializeApp(): Promise<void> {
  try {
    // Initialize database
    await AppDataSource.initialize();
    logger.info('✅ Database connection established');

    // Setup cache
    await setupCache();
    logger.info('✅ Cache initialized');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('🔄 SIGTERM received, shutting down gracefully');
      server.close(async () => {
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('🔄 SIGINT received, shutting down gracefully');
      server.close(async () => {
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp().catch(logger.error);

export default app;
