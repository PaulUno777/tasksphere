import { createFeature, createReducer, on } from '@ngrx/store';
import { User } from '../../core/models';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,

    // Login
    on(AuthActions.login, (state) => ({
      ...state,
      isLoading: true,
      error: null,
    })),

    on(AuthActions.loginSuccess, (state, { user }) => ({
      ...state,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })),

    on(AuthActions.loginFailure, (state, { error }) => ({
      ...state,
      isLoading: false,
      error,
      isAuthenticated: false,
      user: null,
    })),

    // Register
    on(AuthActions.register, (state) => ({
      ...state,
      isLoading: true,
      error: null,
    })),

    on(AuthActions.registerSuccess, (state, { user }) => ({
      ...state,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })),

    on(AuthActions.registerFailure, (state, { error }) => ({
      ...state,
      isLoading: false,
      error,
      isAuthenticated: false,
      user: null,
    })),

    // Load current user
    on(AuthActions.loadCurrentUser, (state) => ({
      ...state,
      isLoading: true,
    })),

    on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
      ...state,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })),

    on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
      ...state,
      isLoading: false,
      error,
      isAuthenticated: false,
      user: null,
    })),

    // Logout
    on(AuthActions.logout, AuthActions.logoutSuccess, () => initialState),

    // Profile update
    on(AuthActions.updateProfile, (state) => ({
      ...state,
      isLoading: true,
      error: null,
    })),

    on(AuthActions.updateProfileSuccess, (state, { user }) => ({
      ...state,
      user,
      isLoading: false,
      error: null,
    })),

    on(AuthActions.updateProfileFailure, (state, { error }) => ({
      ...state,
      isLoading: false,
      error,
    })),

    // Clear error
    on(AuthActions.clearError, (state) => ({
      ...state,
      error: null,
    }))
  ),
});

export const {
  name: authFeatureKey,
  reducer: authReducer,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
} = authFeature;
