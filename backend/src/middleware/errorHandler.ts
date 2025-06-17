import { logger } from '@/logger';
import { config } from '@/utils/config';
import type { NextFunction, Request, Response } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = error.statusCode ?? 500;
  const message = error.message || 'Internal Server Error';

  if (config.nodeEnv === 'development') {
    logger.error('❌ Error:', error);
  }

  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  });
}

export function createError(message: string, statusCode = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
