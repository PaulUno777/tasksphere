import jwt from 'jsonwebtoken';
import { config } from './config';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateAccessToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '30m',
  });
}

export function generateRefreshToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, config.jwtSecretRefresh, {
    expiresIn: '1d',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecretRefresh) as JwtPayload;
}
