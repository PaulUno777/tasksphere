import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="computedClasses"
      (click)="handleClick($event)"
    >
      <lucide-icon
        *ngIf="loading"
        name="loader-2"
        class="animate-spin"
        [size]="iconSize"
      >
      </lucide-icon>

      <lucide-icon *ngIf="icon && !loading" [name]="icon" [size]="iconSize">
      </lucide-icon>

      <span *ngIf="!iconOnly" [class.ml-2]="icon || loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: string;
  @Input() iconOnly = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<Event>();

  get computedClasses(): string[] {
    const base = [
      'btn',
      'disabled:bg-gray-100',
      'disabled:text-gray-700',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    const variants: Record<ButtonVariant, string[]> = {
      primary: ['btn-primary'],
      secondary: ['btn-secondary'],
      danger: ['btn-danger'],
      ghost: ['btn-ghost'],
      outline: ['btn-outline'],
    };

    const sizes: Record<ButtonSize, string[]> = {
      sm: ['btn-sm'],
      md: ['btn-md'],
      lg: ['btn-lg'],
    };

    const width = this.fullWidth ? ['w-full'] : [];
    const iconOnly = this.iconOnly ? ['p-2'] : [];

    return [
      ...base,
      ...variants[this.variant],
      ...(this.iconOnly ? iconOnly : sizes[this.size]),
      ...width,
    ];
  }

  get iconSize(): number {
    switch (this.size) {
      case 'sm':
        return 16;
      case 'lg':
        return 20;
      default:
        return 18;
    }
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
