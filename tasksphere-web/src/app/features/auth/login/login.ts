import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, 
  Mail, Lock, Eye, EyeOff, LogIn, Chrome, Loader2, AlertCircle 
} from 'lucide-angular';
import { AuthStore } from '@store/auth.store';
import { TranslationService } from '@core/services';
import { LoginRequest } from '@core/types';

/**
 * LoginComponent handles user authentication with email/password and Google OAuth
 * Features remember me functionality and comprehensive form validation
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
  ],
  template: `
    <div class="rounded-lg transition-all duration-200 flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-6">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-text-default">
            {{ i18n.translate("auth.login") }}
          </h2>
          <p class="mt-2 text-sm text-text-muted">
            {{ i18n.translate("auth.dontHaveAccount") }}
            <a
              routerLink="/auth/register"
              class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              {{ i18n.translate("auth.register") }}
            </a>
          </p>
        </div>

        <!-- Error Alert -->
        @if (authStore.hasError()) {
          <div class="bg-danger-50 border border-danger-200 rounded-lg p-4 animate-slide-up">
            <div class="flex items-center">
              <lucide-icon
                [img]="AlertCircle"
                [size]="20"
                class="text-danger-500 mr-3"
              ></lucide-icon>
              <p class="text-sm text-danger-700">{{ authStore.error() }}</p>
            </div>
          </div>
        }

        <!-- Login Form -->
        <form
          [formGroup]="loginForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.translate("auth.email") }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <lucide-icon
                  [img]="Mail"
                  [size]="18"
                  class="text-text-muted"
                ></lucide-icon>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                formControlName="email"
                class="input-default pl-10"
                [class.border-danger-500]="isFieldInvalid('email')"
                [placeholder]="i18n.translate('auth.email')"
              />
            </div>
            @if (isFieldInvalid('email')) {
              <p class="mt-1 text-sm text-danger-600">
                @if (loginForm.get('email')?.errors?.['required']) {
                  {{ i18n.translate("auth.emailRequired") }}
                }
                @if (loginForm.get('email')?.errors?.['email']) {
                  {{ i18n.translate("auth.emailInvalid") }}
                }
              </p>
            }
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.translate("auth.password") }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <lucide-icon
                  [img]="Lock"
                  [size]="18"
                  class="text-text-muted"
                ></lucide-icon>
              </div>
              <input
                id="password"
                name="password"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="current-password"
                required
                formControlName="password"
                class="input-default pl-10 pr-10"
                [class.border-danger-500]="isFieldInvalid('password')"
                [placeholder]="i18n.translate('auth.password')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                @if (showPassword()) {
                  <lucide-icon
                    [img]="EyeOff"
                    [size]="18"
                    class="text-text-muted hover:text-text-default"
                  ></lucide-icon>
                } @else {
                  <lucide-icon
                    [img]="Eye"
                    [size]="18"
                    class="text-text-muted hover:text-text-default"
                  ></lucide-icon>
                }
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <p class="mt-1 text-sm text-danger-600">
                {{ i18n.translate("auth.passwordRequired") }}
              </p>
            }
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                formControlName="rememberMe"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border-default rounded"
              />
              <label for="rememberMe" class="ml-2 text-sm text-text-default">
                {{ i18n.translate("auth.rememberMe") }}
              </label>
            </div>

            <div class="text-sm">
              <a
                href="#"
                class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                {{ i18n.translate("auth.forgotPassword") }}
              </a>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || authStore.isLoading()"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            @if (authStore.isLoading()) {
              <lucide-icon
                [img]="Loader2"
                [size]="18"
                class="animate-spin mr-2"
              ></lucide-icon>
            } @else {
              <lucide-icon [img]="LogIn" [size]="18" class="mr-2"></lucide-icon>
            }
            {{ i18n.translate("auth.login") }}
          </button>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border-default"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-background text-text-muted">{{
                i18n.translate("common.or")
              }}</span>
            </div>
          </div>

          <!-- Google OAuth Button -->
          <button
            type="button"
            (click)="onGoogleLogin()"
            [disabled]="authStore.isLoading()"
            class="w-full flex justify-center items-center py-3 px-4 border border-border-default text-sm font-medium rounded-lg text-text-default bg-surface hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <lucide-icon [img]="Chrome" [size]="18" class="mr-2"></lucide-icon>
            {{ i18n.translate("auth.signInWithGoogle") }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  // Lucide icons
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly LogIn = LogIn;
  readonly Chrome = Chrome;
  readonly Loader2 = Loader2;
  readonly AlertCircle = AlertCircle;

  // Injected services
  readonly authStore = inject(AuthStore);
  readonly i18n = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Component state
  readonly showPassword = signal(false);

  // Form setup
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  /**
   * Handles form submission
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    try {
      const formValue = this.loginForm.value;
      const loginData: LoginRequest = {
        email: formValue.email.trim().toLowerCase(),
        password: formValue.password,
      };

      await this.authStore.login(loginData);
      
      // Navigate to dashboard on successful login
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // Error handling is done in the store
      console.error('Login failed:', error);
    }
  }

  /**
   * Handles Google OAuth login
   */
  async onGoogleLogin(): Promise<void> {
    try {
      await this.authStore.loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  /**
   * Toggles password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Checks if a form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Marks all form fields as touched to show validation errors
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}