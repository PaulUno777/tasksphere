import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../utils/database';
import { User } from '../entities';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '@/logger';

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, firstName, lastName, password } = req.body;
      if (!email || !firstName || !lastName || !password) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({ error: 'User already with this email exists' });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = new User();
      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user.passwordHash = passwordHash;

      const savedUser = await this.userRepository.save(user);

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: savedUser.id,
        email: savedUser.email,
      });
      const refreshToken = generateRefreshToken({
        userId: savedUser.id,
        email: savedUser.email,
      });

      // Save refresh token
      savedUser.refreshToken = refreshToken;
      await this.userRepository.save(savedUser);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Save refresh token
      user.refreshToken = refreshToken;
      await this.userRepository.save(user);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const token = authHeader.substring(7);
      // Verify refresh token
      const payload = verifyRefreshToken(token);

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: payload.userId, refreshToken: token },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await this.userRepository.save(user);

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }
}
