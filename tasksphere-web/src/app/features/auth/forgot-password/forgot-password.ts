import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  ArrowLeft,
  Send,
  CheckCircle,
} from 'lucide-angular';
import { TranslationService } from '@core/services';

/**
 * ForgotPasswordComponent handles password reset requests
 * Provides form for users to request password reset via email
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div
      class="rounded-lg transition-all duration-200 flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-6">
        @if (!emailSent()) {
        <!-- Reset Request Form -->
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-text-default">
            {{ i18n.translate('auth.forgotPassword') || 'Forgot Password?' }}
          </h2>
          <p class="mt-2 text-sm text-text-muted">
            {{
              i18n.translate('auth.resetPasswordDescription') ||
                "Enter your email address and we'll send you a link to reset your password."
            }}
          </p>
        </div>

        <form
          [formGroup]="resetForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.translate('auth.email') }}
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
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
              @if (resetForm.get('email')?.errors?.['required']) {
              {{ i18n.translate('auth.emailRequired') }}
              } @if (resetForm.get('email')?.errors?.['email']) {
              {{ i18n.translate('auth.emailInvalid') }}
              }
            </p>
            }
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="resetForm.invalid || isLoading()"
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <lucide-icon [img]="Send" [size]="18" class="mr-2"></lucide-icon>
            {{ i18n.translate('auth.sendResetLink') || 'Send Reset Link' }}
          </button>

          <!-- Back to Login -->
          <div class="text-center">
            <a
              routerLink="/auth/login"
              class="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              <lucide-icon
                [img]="ArrowLeft"
                [size]="16"
                class="mr-1"
              ></lucide-icon>
              {{ i18n.translate('auth.backToLogin') || 'Back to Login' }}
            </a>
          </div>
        </form>
        } @else {
        <!-- Success Message -->
        <div class="text-center space-y-4">
          <div
            class="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto"
          >
            <lucide-icon
              [img]="CheckCircle"
              [size]="32"
              class="text-success-600"
            ></lucide-icon>
          </div>

          <h2 class="text-2xl font-semibold text-text-default">
            {{ i18n.translate('auth.resetLinkSent') || 'Reset Link Sent' }}
          </h2>

          <p class="text-text-muted">
            {{
              i18n.translate('auth.resetLinkSentDescription') ||
                "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."
            }}
          </p>

          <div class="space-y-3 pt-4">
            <button
              type="button"
              (click)="resendEmail()"
              [disabled]="isLoading()"
              class="w-full btn-outline btn-md"
            >
              {{ i18n.translate('auth.resendEmail') || 'Resend Email' }}
            </button>

            <a
              routerLink="/auth/login"
              class="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              <lucide-icon
                [img]="ArrowLeft"
                [size]="16"
                class="mr-1"
              ></lucide-icon>
              {{ i18n.translate('auth.backToLogin') || 'Back to Login' }}
            </a>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  readonly Mail = Mail;
  readonly ArrowLeft = ArrowLeft;
  readonly Send = Send;
  readonly CheckCircle = CheckCircle;

  readonly i18n = inject(TranslationService);
  private readonly fb = inject(FormBuilder);

  readonly emailSent = signal(false);
  readonly isLoading = signal(false);

  resetForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /**
   * Handles form submission
   */
  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      // Simulate API call for password reset
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.emailSent.set(true);
    } catch (error) {
      console.error('Password reset failed:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Resends the reset email
   */
  async resendEmail(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Resend email failed:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Checks if a form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Marks all form fields as touched
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.resetForm.controls).forEach((key) => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }
}
