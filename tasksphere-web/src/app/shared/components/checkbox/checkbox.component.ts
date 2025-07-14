import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-start">
      <div class="flex items-center h-5">
        <input
          [id]="checkboxId"
          type="checkbox"
          [checked]="checked()"
          [disabled]="disabled()"
          [class]="checkboxClasses()"
          (change)="onCheckboxChange($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        />
      </div>

      @if (label || description) {
      <div class="ml-3 text-sm">
        @if (label) {
        <label [for]="checkboxId" [class]="labelClasses()">
          {{ label }}
          @if (required) {
          <span class="text-danger-500 ml-1">*</span>
          }
        </label>
        } @if (description) {
        <p class="text-text-muted">{{ description }}</p>
        }
      </div>
      }
    </div>

    @if (error) {
    <p class="text-sm text-danger-600 flex items-center mt-2">
      <lucide-icon [img]="alertIcon" [size]="16" class="mr-1"></lucide-icon>
      {{ error }}
    </p>
    }
  `,
  styles: [
    `
      @utility checkbox-base {
        @apply h-4 w-4 text-primary-600 focus:ring-primary-500 border-border-default rounded 
             transition-colors duration-200;
      }

      @utility checkbox-error {
        @apply border-danger-500 focus:ring-danger-500;
      }

      @utility checkbox-disabled {
        @apply opacity-50 cursor-not-allowed;
      }
    `,
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() description = '';
  @Input() error = '';
  @Input() required = false;
  @Input() checkboxId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() focused = new EventEmitter<void>();
  @Output() blurred = new EventEmitter<void>();

  alertIcon = AlertCircle;

  checked = signal(false);
  disabled = signal(false);

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  checkboxClasses = computed(() => {
    const base = 'checkbox-base';
    const classes = [base];

    if (this.error) classes.push('checkbox-error');
    if (this.disabled()) classes.push('checkbox-disabled');

    return classes.join(' ');
  });

  labelClasses = computed(() => {
    const base = 'font-medium text-text-default cursor-pointer';
    const classes = [base];

    if (this.disabled()) classes.push('opacity-50 cursor-not-allowed');

    return classes.join(' ');
  });

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;

    this.checked.set(newValue);
    this.onChange(newValue);
    this.checkedChange.emit(newValue);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  onFocus(): void {
    this.focused.emit();
  }

  writeValue(value: boolean): void {
    this.checked.set(value || false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
