import { User } from '@core/models';
import { SupportedLanguage } from './enum.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  language?: SupportedLanguage;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface GoogleAuthRequest {
  code: string;
  state: string;
  language?: SupportedLanguage;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  language?: SupportedLanguage;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
