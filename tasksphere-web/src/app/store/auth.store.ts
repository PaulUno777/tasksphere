import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { User } from '@core/models';
import {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '@core/types';
import {
  AuthService,
  ToastService,
  TranslationService,
  UserService,
} from '@core/services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, isAuthenticated, isInitialized, error }) => ({
    userFullName: computed(() => user()?.fullName || ''),
    userInitials: computed(() => {
      const u = user();
      return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '';
    }),
    userEmail: computed(() => user()?.email || ''),
    userAvatarUrl: computed(() => user()?.avatarUrl || ''),
    userLanguage: computed(() => user()?.language || 'en'),
    isLoggedIn: computed(() => isAuthenticated() && !!user()),
    hasError: computed(() => !!error()),
    canNavigate: computed(() => isInitialized()),
    canManageSystem: computed(() => {
      const u = user();
      return u?.isEmailVerified;
    }),
  })),
  withMethods(
    (
      store,
      authService = inject(AuthService),
      userService = inject(UserService),
      toastService = inject(ToastService),
      i18n = inject(TranslationService)
    ) => ({
      async login(credentials: LoginRequest) {
        patchState(store, { isLoading: true, error: null });

        try {
          const response = await authService.login(credentials);

          patchState(store, {
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          // Show success toast
          toastService.success(i18n.t('auth.loginSuccess'));

          return response;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('auth.loginError');

          patchState(store, {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      // Register user
      async register(userData: RegisterRequest) {
        patchState(store, { isLoading: true, error: null });

        try {
          const response = await authService.register(userData);

          patchState(store, {
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
          toastService.success(i18n.t('auth.registerSuccess'));

          return response;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('auth.registerError');

          patchState(store, {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      // Google OAuth login
      async loginWithGoogle() {
        patchState(store, { isLoading: true, error: null });

        try {
          await authService.initiateGoogleLogin();
          // Note: The actual completion will be handled by the OAuth callback
        } catch (error: any) {
          const errorMessage = error.message || 'Google login failed';

          patchState(store, {
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      // Complete Google OAuth (called from callback)
      async completeGoogleAuth(code: string, state: string) {
        patchState(store, { isLoading: true, error: null });

        try {
          const response = await authService.completeGoogleAuth({
            code,
            state,
          });

          patchState(store, {
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          return response;
        } catch (error: any) {
          const errorMessage = error.message || 'Google authentication failed';

          patchState(store, {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      // Refresh token
      async refreshToken() {
        try {
          const response = await authService.refreshToken();

          patchState(store, {
            user: response.user,
            isAuthenticated: true,
            error: null,
          });

          return response;
        } catch (error: any) {
          this.logout();
          throw error;
        }
      },

      // Logout user
      logout() {
        authService.logout();
        patchState(store, {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        toastService.success(i18n.t('auth.logoutSuccess'));
      },

      // Profile Management Methods
      async updateProfile(profileData: UpdateProfileRequest) {
        patchState(store, { isLoading: true, error: null });

        try {
          // Validate profile data
          const validationErrors = userService.validateProfileData(profileData);
          if (validationErrors) {
            throw new Error(Object.values(validationErrors)[0]);
          }

          const updatedUser = await userService.updateProfile(profileData);

          patchState(store, {
            user: updatedUser,
            isLoading: false,
            error: null,
          });

          toastService.success(i18n.t('profile.profileUpdated'));
          return updatedUser;
        } catch (error: any) {
          const errorMessage = error.message || 'Profile update failed';

          patchState(store, {
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      async changePassword(passwordData: ChangePasswordRequest) {
        patchState(store, { isLoading: true, error: null });

        try {
          const validationErrors =
            userService.validatePasswordData(passwordData);
          if (validationErrors) {
            throw new Error(Object.values(validationErrors)[0]);
          }

          await userService.changePassword(passwordData);

          patchState(store, {
            isLoading: false,
            error: null,
          });

          toastService.success(i18n.t('profile.passwordChanged'));
        } catch (error: any) {
          const errorMessage = error.message || 'Password change failed';

          patchState(store, {
            isLoading: false,
            error: errorMessage,
          });

          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      // Initialization and State Management
      async initializeAuth() {
        const isAuthenticated = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();

        if (isAuthenticated && currentUser) {
          try {
            // Verify token by fetching current user data
            const user = await userService.getCurrentUser();

            patchState(store, {
              user,
              isAuthenticated: true,
              isInitialized: true,
              error: null,
            });
          } catch (error) {
            // Token is invalid, logout
            authService.logout();
            patchState(store, {
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              error: null,
            });

            toastService.warning(i18n.t('auth.sessionExpired'));
          }
        } else {
          patchState(store, {
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            error: null,
          });
        }
      },

      clearError() {
        patchState(store, { error: null });
      },

      setLoading(loading: boolean) {
        patchState(store, { isLoading: loading });
      },

      async validateSession(): Promise<boolean> {
        try {
          const isValid = await authService.validateSession();

          if (!isValid) {
            patchState(store, {
              user: null,
              isAuthenticated: false,
              error: null,
            });
          }

          return isValid;
        } catch (error) {
          console.error('Session validation error:', error);
          return false;
        }
      },

      async refreshUserData() {
        if (!store.isAuthenticated()) {
          return;
        }

        try {
          const user = await userService.getCurrentUser();

          patchState(store, {
            user,
            error: null,
          });
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // Don't logout on user data refresh failure
        }
      },

      async updateLanguage(language: 'en' | 'fr') {
        if (!store.user()) {
          return;
        }

        try {
          await this.updateProfile({ language });
          // Language will be updated in the user object via updateProfile
        } catch (error) {
          console.error('Failed to update language:', error);
          throw error;
        }
      },
    })
  )
);
