import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-angular';
import { AuthStore } from '@store/auth.store';
import { TranslationService } from '@core/services';

/**
 * OAuthCallbackComponent handles OAuth callback processing
 * Processes authorization code and completes authentication
 */
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background">
      <div class="max-w-md w-full text-center space-y-6">
        @if (isProcessing) {
        <!-- Processing State -->
        <div class="flex flex-col items-center space-y-4">
          <div
            class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center"
          >
            <lucide-icon
              [img]="Loader2"
              [size]="32"
              class="text-primary-600 animate-spin"
            ></lucide-icon>
          </div>
          <h2 class="text-xl font-semibold text-text-default">
            {{ i18n.t('auth.processing') || 'Processing authentication...' }}
          </h2>
          <p class="text-text-muted">
            {{
              i18n.t('auth.pleaseWait') ||
                'Please wait while we complete your sign-in.'
            }}
          </p>
        </div>
        } @if (isSuccess) {
        <!-- Success State -->
        <div class="flex flex-col items-center space-y-4">
          <div
            class="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center"
          >
            <lucide-icon
              [img]="CheckCircle"
              [size]="32"
              class="text-success-600"
            ></lucide-icon>
          </div>
          <h2 class="text-xl font-semibold text-text-default">
            {{ i18n.t('auth.loginSuccess') }}
          </h2>
          <p class="text-text-muted">
            {{
              i18n.t('auth.redirectingToDashboard') ||
                'Redirecting to dashboard...'
            }}
          </p>
        </div>
        } @if (isError) {
        <!-- Error State -->
        <div class="flex flex-col items-center space-y-4">
          <div
            class="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center"
          >
            <lucide-icon
              [img]="AlertCircle"
              [size]="32"
              class="text-danger-600"
            ></lucide-icon>
          </div>
          <h2 class="text-xl font-semibold text-text-default">
            {{ i18n.t('auth.authenticationFailed') || 'Authentication Failed' }}
          </h2>
          <p class="text-text-muted">
            {{ errorMessage }}
          </p>
          <button
            type="button"
            (click)="goToLogin()"
            class="btn-primary btn-md"
          >
            {{ i18n.t('auth.backToLogin') || 'Back to Login' }}
          </button>
        </div>
        }
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  readonly Loader2 = Loader2;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  readonly i18n = inject(TranslationService);

  isProcessing = true;
  isSuccess = false;
  isError = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    try {
      // Get authorization code and state from query parameters
      const code = this.route.snapshot.queryParams['code'];
      const state = this.route.snapshot.queryParams['state'];
      const error = this.route.snapshot.queryParams['error'];

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Complete OAuth authentication
      await this.authStore.completeGoogleAuth(code, state);

      // Show success state briefly
      this.isProcessing = false;
      this.isSuccess = true;

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    } catch (error: any) {
      console.error('OAuth callback error:', error);

      this.isProcessing = false;
      this.isError = true;
      this.errorMessage =
        error.message || this.i18n.translate('auth.authenticationFailed');
    }
  }

  /**
   * Navigates back to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
