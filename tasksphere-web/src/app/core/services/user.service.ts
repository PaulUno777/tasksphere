import { inject, Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { User } from '@core/models';
import { ChangePasswordRequest, UpdateProfileRequest } from '@core/types';

/**
 * UserService handles user profile management operations
 * Including profile updates, password changes, and user data retrieval
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly httpClient = inject(HttpClientService);

  /**
   * Gets the current user's profile information
   * @returns Promise with current user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await this.httpClient.get<User>('/api/v1/users/me');
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Updates the current user's profile
   * @param profileData - Profile data to update
   * @returns Promise with updated user data
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    try {
      const updatedUser = await this.httpClient.put<User>(
        '/api/v1/users/me',
        profileData
      );
      console.log('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Changes the current user's password
   * @param passwordData - Current and new password data
   * @returns Promise that resolves when password is changed
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      await this.httpClient.put<void>(
        '/api/v1/users/me/password',
        passwordData
      );
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Validates a profile update request
   * @param profileData - Profile data to validate
   * @returns Validation errors or null if valid
   */
  validateProfileData(
    profileData: UpdateProfileRequest
  ): Record<string, string> | null {
    const errors: Record<string, string> = {};

    // Validate first name
    if (profileData.firstName !== undefined) {
      if (!profileData.firstName || profileData.firstName.trim().length < 2) {
        errors['firstName'] = 'First name must be at least 2 characters';
      }
      if (profileData.firstName.length > 50) {
        errors['firstName'] = 'First name must be no more than 50 characters';
      }
    }

    // Validate last name
    if (profileData.lastName !== undefined) {
      if (!profileData.lastName || profileData.lastName.trim().length < 2) {
        errors['lastName'] = 'Last name must be at least 2 characters';
      }
      if (profileData.lastName.length > 50) {
        errors['lastName'] = 'Last name must be no more than 50 characters';
      }
    }

    // Validate avatar URL if provided
    if (profileData.avatarUrl !== undefined && profileData.avatarUrl) {
      try {
        new URL(profileData.avatarUrl);
      } catch {
        errors['avatarUrl'] = 'Avatar URL must be a valid URL';
      }
    }

    // Validate language
    if (profileData.language !== undefined) {
      if (!['en', 'fr'].includes(profileData.language)) {
        errors['language'] = 'Language must be either en or fr';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Validates a password change request
   * @param passwordData - Password data to validate
   * @returns Validation errors or null if valid
   */
  validatePasswordData(
    passwordData: ChangePasswordRequest
  ): Record<string, string> | null {
    const errors: Record<string, string> = {};

    // Validate current password
    if (!passwordData.currentPassword) {
      errors['currentPassword'] = 'Current password is required';
    }

    // Validate new password
    if (!passwordData.newPassword) {
      errors['newPassword'] = 'New password is required';
    } else {
      // Password strength validation
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        errors['newPassword'] =
          'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character';
      }

      // Check if new password is different from current
      if (passwordData.newPassword === passwordData.currentPassword) {
        errors['newPassword'] =
          'New password must be different from current password';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}
