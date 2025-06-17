import 'reflect-metadata';
import express from 'express';
import { config } from 'dotenv';

config();
const app: express.Express = express();
const PORT: number = Number(process.env['PORT']) || 3000;

// Security middleware

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

async function initializeApp(): Promise<void> {
  try {
    console.log('✅ Database connection established');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 SIGTERM received, shutting down gracefully');
      server.close(async () => {
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('🔄 SIGINT received, shutting down gracefully');
      server.close(async () => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp().catch(console.error);

export default app;
