import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  LucideAngularModule,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Loader2,
  LucideIconData,
} from 'lucide-angular';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';
export type FormFieldSize = 'sm' | 'md' | 'lg';
export type FormFieldVariant = 'default' | 'filled' | 'outlined';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: FormFieldType = 'text';
  @Input() size: FormFieldSize = 'md';
  @Input() variant: FormFieldVariant = 'default';
  @Input() leftIcon?: LucideIconData;
  @Input() rightIcon?: LucideIconData;
  @Input() success = '';
  @Input() helpText = '';
  @Input() required = false;
  @Input() readonly = false;
  @Input() loading = false;
  @Input() showPasswordToggle = true;
  @Input() autocomplete = '';
  @Input() inputId = `form-field-${Math.random().toString(36).substring(2, 9)}`;
  @Input() showPasswordStrength = false;
  /**
   * Password strength: 0-4 (number of bars to fill)
   */
  @Input() passwordStrength: number = 0;
  /**
   * Password strength text (e.g., 'Weak', 'Strong')
   */
  @Input() passwordStrengthText: string = '';
  
  // Signals instead of regular @Input()
  readonly error = input<string>('');
  readonly errorList = input<string[]>([]);

  @Output() enterPressed = new EventEmitter<void>();
  @Output() rightIconClick = new EventEmitter<void>();

  // Icons
  eyeIcon = Eye;
  eyeOffIcon = EyeOff;
  alertIcon = AlertCircle;
  checkIcon = Check;
  loaderIcon = Loader2;

  // Internal state
  value = signal('');
  focused = signal(false);
  disabled = signal(false);
  passwordVisible = signal(false);

  // ControlValueAccessor
  private onChange = (value: string) => {};
  private onTouched = () => {};

  // Computed properties
  computedType = computed(() => {
    if (this.type === 'password' && this.passwordVisible()) {
      return 'text';
    }
    return this.type;
  });

  /**
   * Returns true if there is any error (string or errorList)
   */
  hasError = computed(
    () => !!this.error() || (this.errorList() && this.errorList().length > 0)
  );

  labelClasses = computed(() => {
    const classes = ['block', 'text-sm', 'font-medium', 'mb-2'];
    // Only one color class at a time
    if (this.hasError()) {
      classes.push('text-danger-600');
    } else if (this.success) {
      classes.push('text-success-600');
    } else {
      classes.push('text-text-default');
    }

    return classes.join(' ');
  });

  inputClasses = computed(() => {
    const base = `input-${this.variant} input-${this.size}`;
    const classes = [base];

    if (this.leftIcon) classes.push('pl-10');
    if (
      this.rightIcon ||
      (this.type === 'password' && this.showPasswordToggle) ||
      this.loading
    ) {
      classes.push('pr-10');
    }
    if (this.hasError()) classes.push('input-error');
    if (this.success) classes.push('input-success');
    if (this.disabled()) classes.push('input-disabled');

    return classes.join(' ');
  });

  leftIconClasses = computed(() => {
    if (this.hasError()) return 'text-danger-500';
    if (this.success) return 'text-success-500';
    return 'text-text-muted';
  });

  rightIconClasses = computed(() => {
    const base = 'transition-colors';
    const classes = [base];

    if (this.disabled()) classes.push('cursor-not-allowed opacity-50');

    return classes.join(' ');
  });

  iconSize = computed(() => {
    switch (this.size) {
      case 'sm':
        return 16;
      case 'lg':
        return 20;
      default:
        return 18;
    }
  });

  // Event handlers
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onEnter(): void {
    this.enterPressed.emit();
  }

  onRightIconClick(): void {
    if (this.type === 'password' && this.showPasswordToggle) {
      this.passwordVisible.update((v) => !v);
    } else {
      this.rightIconClick.emit();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
