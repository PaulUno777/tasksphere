import { Injectable, inject } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  GoogleAuthUrlResponse,
  GoogleAuthRequest,
} from '../types';
import { Router } from '@angular/router';
import { environment } from 'src/app/environments/environment';
import { User } from '@core/models';

/**
 * AuthService handles all authentication-related operations
 * Including login, register, token management, and Google OAuth
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClientService);
  private readonly router = inject(Router);

  /**
   * Registers a new user account
   * @param userData - User registration data
   * @returns Promise with authentication response
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.httpClient.post<AuthResponse>(
        '/api/v1/auth/register',
        userData
      );

      // Store tokens and user data
      this.storeAuthData(response);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticates user with email and password
   * @param credentials - Login credentials
   * @returns Promise with authentication response
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.httpClient.post<AuthResponse>(
        '/api/v1/auth/login',
        credentials
      );

      this.storeAuthData(response);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refreshes the access token using refresh token
   * @param refreshData - Optional refresh token data
   * @returns Promise with new authentication response
   */
  async refreshToken(refreshData?: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.httpClient.post<AuthResponse>(
        '/api/v1/auth/refresh-token',
        { refreshToken }
      );

      // Store new tokens and user data
      this.storeAuthData(response);

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      this.logout();
      throw error;
    }
  }

  /**
   * Gets Google OAuth authorization URL
   * @returns Promise with Google auth URL and state
   */
  async getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
    try {
      return await this.httpClient.get<GoogleAuthUrlResponse>(
        '/api/v1/auth/google'
      );
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
      throw error;
    }
  }

  /**
   * Completes Google OAuth authentication
   * @param authData - Google OAuth response data
   * @returns Promise with authentication response
   */
  async completeGoogleAuth(authData: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      const response = await this.httpClient.post<AuthResponse>(
        '/api/v1/auth/google',
        authData
      );

      // Store tokens and user data
      this.storeAuthData(response);

      return response;
    } catch (error) {
      console.error('Google auth completion failed:', error);
      throw error;
    }
  }

  /**
   * Initiates Google OAuth login process
   * Handles both popup and redirect flows based on environment
   */
  async initiateGoogleLogin(): Promise<void> {
    try {
      const { authUrl } = await this.getGoogleAuthUrl();

      if (environment.production) {
        // In production, redirect to Google OAuth
        window.location.href = authUrl;
      } else {
        // In development, open popup window
        const popup = window.open(
          authUrl,
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup completion
        this.listenForOAuthCompletion();
      }
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      throw error;
    }
  }

  /**
   * Logs out the current user
   * Clears all stored authentication data and redirects to login
   */
  logout(): void {
    try {
      // Clear stored data
      this.clearAuthData();

      // Navigate to login page
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Checks if user is currently authenticated
   * @returns True if user has valid tokens and user data
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Gets the current authenticated user
   * @returns User object or null if not authenticated
   */
  getCurrentUser(): User | null {
    try {
      const userJson = this.getStorageItem(environment.storage.userKey);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Gets the current access token
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return this.getStorageItem(environment.storage.tokenKey);
  }

  /**
   * Gets the current refresh token
   * @returns Refresh token or null
   */
  getRefreshToken(): string | null {
    return this.getStorageItem(environment.storage.refreshTokenKey);
  }

  /**
   * Checks if the current access token is expired
   * @returns True if token is expired or invalid
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      // Decode JWT payload to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't decode
    }
  }

  /**
   * Ensures the current token is valid, refreshing if necessary
   * @throws Error if user is not authenticated or token refresh fails
   */
  async ensureValidToken(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        this.logout();
        throw new Error('Unable to refresh token');
      }
    }
  }

  /**
   * Validates the current session
   * @returns True if session is valid
   */
  async validateSession(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      // Try to refresh token if needed
      await this.ensureValidToken();
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Stores authentication data in localStorage
   * @param authResponse - Authentication response from server
   */
  private storeAuthData(authResponse: AuthResponse): void {
    try {
      this.setStorageItem(
        environment.storage.tokenKey,
        authResponse.accessToken
      );
      this.setStorageItem(
        environment.storage.refreshTokenKey,
        authResponse.refreshToken
      );
      this.setStorageItem(
        environment.storage.userKey,
        JSON.stringify(authResponse.user)
      );
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Clears all authentication data from localStorage
   */
  private clearAuthData(): void {
    try {
      this.removeStorageItem(environment.storage.tokenKey);
      this.removeStorageItem(environment.storage.refreshTokenKey);
      this.removeStorageItem(environment.storage.userKey);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Listens for OAuth completion in popup window
   */
  private listenForOAuthCompletion(): void {
    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { code, state, error } = event.data;

      if (error) {
        console.error('OAuth error:', error);
        return;
      }

      if (code && state) {
        try {
          await this.completeGoogleAuth({ code, state });
          console.log('OAuth login successful');

          // Navigate to dashboard after successful login
          this.router.navigate(['/dashboard']);
        } catch (err) {
          console.error('OAuth processing error:', err);
        }
      }

      // Clean up event listener
      window.removeEventListener('message', messageHandler);
    };

    window.addEventListener('message', messageHandler);
  }

  /**
   * Safely gets item from localStorage
   * @param key - Storage key
   * @returns Value or null
   */
  private getStorageItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Safely sets item in localStorage
   * @param key - Storage key
   * @param value - Value to store
   */
  private setStorageItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to write to localStorage: ${key}`, error);
      throw error;
    }
  }

  /**
   * Safely removes item from localStorage
   * @param key - Storage key
   */
  private removeStorageItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove from localStorage: ${key}`, error);
    }
  }
}
