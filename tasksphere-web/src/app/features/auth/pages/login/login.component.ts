import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LucideAngularModule,
  LucideIconData,
  SquareKanban,
} from 'lucide-angular';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { AuthActions } from '@store/auth/auth.actions';
import { selectIsLoading, selectError } from '@store/auth/auth.reducer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    ButtonComponent,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  //Lucide icons
  readonly SquareKanban = SquareKanban;
  readonly AlertCircle = AlertCircle;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  showPassword = signal(false);

  isSubmitted = signal(false);
  // Store selectors
  isLoading = this.store.selectSignal(selectIsLoading);
  error = this.store.selectSignal(selectError);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get passwordIcon(): LucideIconData {
    return this.showPassword() ? Eye : EyeOff;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      this.store.dispatch(
        AuthActions.login({ credentials: { email, password } })
      );
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
