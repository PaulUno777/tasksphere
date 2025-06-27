import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Signals for reactive state management
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal(false);
  private isAuthenticatedSignal = signal(false);

  // Computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  private tokenKey = 'tasktphere_access_token';
  private refreshTokenKey = 'tasktphere_refresh_token';

  constructor() {
    // Initialize auth state on service creation
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.getStoredToken();
    if (token) {
      this.isLoadingSignal.set(true);
      this.loadCurrentUser().subscribe({
        next: () => {
          this.isAuthenticatedSignal.set(true);
          this.isLoadingSignal.set(false);
        },
        error: () => {
          this.clearAuth();
          this.isLoadingSignal.set(false);
        },
      });
    }
  }

  login(credentials: LoginRequest): Observable<User> {
    this.isLoadingSignal.set(true);
    return this.apiService.login(credentials.email, credentials.password).pipe(
      tap((response: AuthResponse) => {
        this.storeTokens(response.accessToken, response.refreshToken);
        this.currentUserSignal.set(response.user);
        this.isAuthenticatedSignal.set(true);
      }),
      map((response: AuthResponse) => response.user),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    this.isLoadingSignal.set(true);
    return this.apiService.register(userData).pipe(
      tap((response: AuthResponse) => {
        this.storeTokens(response.accessToken, response.refreshToken);
        this.currentUserSignal.set(response.user);
        this.isAuthenticatedSignal.set(true);
      }),
      map((response: AuthResponse) => response.user),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.refreshToken(refreshToken).pipe(
      tap((response: any) => {
        this.storeTokens(response.accessToken, response.refreshToken);
      }),
      map((response: any) => response.accessToken),
      catchError((error) => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.apiService
      .getCurrentUser()
      .pipe(tap((user: User) => this.currentUserSignal.set(user)));
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    this.isLoadingSignal.set(true);
    return this.apiService.updateProfile(userData).pipe(
      tap((response: any) => {
        this.currentUserSignal.set(response.user);
      }),
      map((response: any) => response.user),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
      tap(() => this.isLoadingSignal.set(false))
    );
  }
}
