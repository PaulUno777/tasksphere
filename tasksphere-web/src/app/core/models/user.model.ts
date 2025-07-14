import { SupportedLanguage } from '@core/types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  language: SupportedLanguage;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
