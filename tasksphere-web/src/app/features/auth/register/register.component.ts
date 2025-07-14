import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, 
  User, Mail, Lock, Eye, EyeOff, UserPlus, Chrome, Check, Loader2, AlertCircle 
} from 'lucide-angular';
import { AuthStore } from '@store/auth.store';
import { TranslationService } from '@core/services';
import { RegisterRequest } from '@core/types';

/**
 * Custom validator for password confirmation
 */
function passwordMatchValidator(form: FormGroup) {
  const password = form.get('password');
  const confirmPassword = form.get('confirmPassword');
  
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  
  return null;
}

/**
 * RegisterComponent handles user registration with validation and Google OAuth
 * Features password strength indicator and comprehensive form validation
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
  ],
  template: `
    <div class="rounded-lg transition-all duration-200 flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-4">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-text-default">
            {{ i18n.translate("auth.createAccount") }}
          </h2>
          <p class="mt-2 text-sm text-text-muted">
            {{ i18n.translate("auth.alreadyHaveAccount") }}
            <a
              routerLink="/auth/login"
              class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              {{ i18n.translate("auth.login") }}
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

        <!-- Register Form -->
        <form
          [formGroup]="registerForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-4"
        >
          <!-- Name Fields Row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- First Name -->
            <div>
              <label
                for="firstName"
                class="block text-sm font-medium text-text-default mb-2"
              >
                {{ i18n.translate("auth.firstName") }}
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <lucide-icon
                    [img]="User"
                    [size]="18"
                    class="text-text-muted"
                  ></lucide-icon>
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autocomplete="given-name"
                  required
                  formControlName="firstName"
                  class="input-default pl-10"
                  [class.border-danger-500]="isFieldInvalid('firstName')"
                  [placeholder]="i18n.translate('auth.firstName')"
                />
              </div>
              @if (isFieldInvalid('firstName')) {
                <p class="mt-1 text-sm text-danger-600">
                  @if (registerForm.get('firstName')?.errors?.['required']) {
                    {{ i18n.translate("auth.firstNameRequired") }}
                  }
                  @if (registerForm.get('firstName')?.errors?.['minlength']) {
                    {{ i18n.translate("auth.firstNameMinLength") }}
                  }
                </p>
              }
            </div>

            <!-- Last Name -->
            <div>
              <label
                for="lastName"
                class="block text-sm font-medium text-text-default mb-2"
              >
                {{ i18n.translate("auth.lastName") }}
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autocomplete="family-name"
                required
                formControlName="lastName"
                class="input-default"
                [class.border-danger-500]="isFieldInvalid('lastName')"
                [placeholder]="i18n.translate('auth.lastName')"
              />
              @if (isFieldInvalid('lastName')) {
                <p class="mt-1 text-sm text-danger-600">
                  @if (registerForm.get('lastName')?.errors?.['required']) {
                    {{ i18n.translate("auth.lastNameRequired") }}
                  }
                  @if (registerForm.get('lastName')?.errors?.['minlength']) {
                    {{ i18n.translate("auth.lastNameMinLength") }}
                  }
                </p>
              }
            </div>
          </div>

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
                @if (registerForm.get('email')?.errors?.['required']) {
                  {{ i18n.translate("auth.emailRequired") }}
                }
                @if (registerForm.get('email')?.errors?.['email']) {
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
                autocomplete="new-password"
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

            <!-- Password Strength Indicator -->
            @if (registerForm.get('password')?.value) {
              <div class="mt-2">
                <div class="flex space-x-1">
                  @for (item of [1,2,3,4]; track item) {
                    <div
                      class="h-2 flex-1 rounded"
                      [class]="getPasswordStrengthColor(item)"
                    ></div>
                  }
                </div>
                <p class="text-xs text-text-muted mt-1">
                  {{ i18n.translate("auth.passwordStrength") }}:
                  {{ getPasswordStrengthText() }}
                </p>
              </div>
            }
            @if (isFieldInvalid('password')) {
              <p class="mt-1 text-sm text-danger-600">
                @if (registerForm.get('password')?.errors?.['required']) {
                  {{ i18n.translate("auth.passwordRequired") }}
                }
                @if (registerForm.get('password')?.errors?.['minlength']) {
                  {{ i18n.translate("auth.passwordMinLength") }}
                }
                @if (registerForm.get('password')?.errors?.['pattern']) {
                  {{ i18n.translate("auth.passwordPattern") }}
                }
              </p>
            }
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.translate("auth.confirmPassword") }}
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
                id="confirmPassword"
                name="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                autocomplete="new-password"
                required
                formControlName="confirmPassword"
                class="input-default pl-10 pr-10"
                [class.border-danger-500]="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']"
                [class.border-success-500]="
                  registerForm.get('confirmPassword')?.valid &&
                  registerForm.get('confirmPassword')?.value &&
                  !registerForm.errors?.['passwordMismatch']
                "
                [placeholder]="i18n.translate('auth.confirmPassword')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                (click)="toggleConfirmPasswordVisibility()"
                [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
              >
                @if (registerForm.get('confirmPassword')?.valid &&
                registerForm.get('confirmPassword')?.value &&
                !registerForm.errors?.['passwordMismatch']) {
                  <lucide-icon
                    [img]="Check"
                    [size]="18"
                    class="text-success-500"
                  ></lucide-icon>
                } @else if (showConfirmPassword()) {
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
            @if (isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']) {
              <p class="mt-1 text-sm text-danger-600">
                @if (registerForm.get('confirmPassword')?.errors?.['required']) {
                  {{ i18n.translate("auth.confirmPasswordRequired") }}
                }
                @if (registerForm.errors?.['passwordMismatch']) {
                  {{ i18n.translate("auth.passwordMismatch") }}
                }
              </p>
            }
          </div>

          <!-- Language Selection -->
          <div>
            <label
              for="language"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.translate("common.language") }}
            </label>
            <select id="language" formControlName="language" class="input-default">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <!-- Terms and Conditions -->
          <div class="flex items-start">
            <input
              id="acceptTerms"
              type="checkbox"
              formControlName="acceptTerms"
              class="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-border-default rounded"
            />
            <label for="acceptTerms" class="ml-3 text-sm text-text-default">
              {{ i18n.translate("auth.iAgreeToThe") }}
              <a href="#" class="text-primary-600 hover:text-primary-500">{{
                i18n.translate("auth.termsOfService")
              }}</a>
              {{ i18n.translate("common.and") }}
              <a href="#" class="text-primary-600 hover:text-primary-500">{{
                i18n.translate("auth.privacyPolicy")
              }}</a>
            </label>
          </div>
          @if (isFieldInvalid('acceptTerms')) {
            <p class="text-sm text-danger-600">
              {{ i18n.translate("auth.termsRequired") }}
            </p>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="registerForm.invalid || authStore.isLoading()"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            @if (authStore.isLoading()) {
              <lucide-icon
                [img]="Loader2"
                [size]="18"
                class="animate-spin mr-2"
              ></lucide-icon>
            } @else {
              <lucide-icon [img]="UserPlus" [size]="18" class="mr-2"></lucide-icon>
            }
            {{ i18n.translate("auth.createAccount") }}
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
            (click)="onGoogleRegister()"
            [disabled]="authStore.isLoading()"
            class="w-full flex justify-center items-center py-3 px-4 border border-border-default text-sm font-medium rounded-lg text-text-default bg-surface hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <lucide-icon [img]="Chrome" [size]="18" class="mr-2"></lucide-icon>
            {{ i18n.translate("auth.signUpWithGoogle") }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  // Lucide icons
  readonly User = User;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly UserPlus = UserPlus;
  readonly Chrome = Chrome;
  readonly Check = Check;
  readonly Loader2 = Loader2;
  readonly AlertCircle = AlertCircle;

  // Injected services
  readonly authStore = inject(AuthStore);
  readonly i18n = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // Component state
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  // Form setup
  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    ]],
    confirmPassword: ['', [Validators.required]],
    language: [this.i18n.getCurrentLanguage()],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: passwordMatchValidator });

  /**
   * Handles form submission
   */
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    try {
      const formValue = this.registerForm.value;
      const registerData: RegisterRequest = {
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        email: formValue.email.trim().toLowerCase(),
        password: formValue.password,
        language: formValue.language,
      };

      await this.authStore.register(registerData);
      
      // Navigate to dashboard on successful registration
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // Error handling is done in the store
      console.error('Registration failed:', error);
    }
  }

  /**
   * Handles Google OAuth registration
   */
  async onGoogleRegister(): Promise<void> {
    try {
      await this.authStore.loginWithGoogle();
    } catch (error) {
      console.error('Google registration failed:', error);
    }
  }

  /**
   * Toggles password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Toggles confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(show => !show);
  }

  /**
   * Checks if a form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Marks all form fields as touched to show validation errors
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Gets password strength level (1-4)
   */
  private getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    return Math.min(strength, 4);
  }

  /**
   * Gets password strength color classes
   */
  getPasswordStrengthColor(index: number): string {
    const strength = this.getPasswordStrength();
    
    if (index <= strength) {
      switch (strength) {
        case 1: return 'bg-danger-500';
        case 2: return 'bg-warning-500';
        case 3: return 'bg-accent-500';
        case 4: return 'bg-success-500';
        default: return 'bg-neutral-200';
      }
    }
    
    return 'bg-neutral-200 dark:bg-neutral-700';
  }

  /**
   * Gets password strength text
   */
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    
    switch (strength) {
      case 1: return this.i18n.translate('auth.passwordWeak');
      case 2: return this.i18n.translate('auth.passwordFair');
      case 3: return this.i18n.translate('auth.passwordGood');
      case 4: return this.i18n.translate('auth.passwordStrong');
      default: return this.i18n.translate('auth.passwordWeak');
    }
  }
}
