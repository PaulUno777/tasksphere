import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.printf(({ level, message }) => {
  return `[${level.toUpperCase()}] - ${message}`;
});

// Define a daily rotating transport for files
const fileTransport = new DailyRotateFile({
  dirname: 'logs',
  filename: 'application-%DATE%.log',
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Combine transports
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [new winston.transports.Console(), fileTransport],
});

// Handle uncaught exceptions & promises
process.on('unhandledRejection', err => {
  logger.error({ message: 'unhandledRejection', stack: String(err) });
});

process.on('uncaughtException', err => {
  logger.error({ message: 'uncaughtException', stack: String(err) });
});
