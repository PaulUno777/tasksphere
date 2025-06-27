// ui-input.component.ts
import { Component, Input, forwardRef, signal, computed } from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <label class="block text-sm font-medium mb-1" [for]="id">
      {{ label }}
    </label>
    <input
      [id]="id"
      [type]="type"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [(ngModel)]="value"
      (blur)="onTouched()"
      class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 transition-all"
      [class.border-red-500]="hasError"
      [class.focus:ring-primary-500]="!hasError"
    />
    @if (hasError) {
    <p class="text-red-600 text-sm mt-1">
      {{ error }}
    </p>
    }
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() id = crypto.randomUUID();
  @Input() disabled = false;

  value = '';
  hasError = false;

  private onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }
}
