import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LucideIconData, Loader2 } from 'lucide-angular';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './button.html',
  styles: [
    `
     
    `,
  ],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() leftIcon?: LucideIconData;
  @Input() rightIcon?: LucideIconData;
  @Input() content = '';
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<void>();

  loaderIcon = Loader2;

  buttonClasses = computed(() => {
    const classes = [`btn-${this.variant}`, `btn-${this.size}`];

    if (this.fullWidth) {
      classes.push('w-full');
    }

    return classes.join(' ');
  });

  iconSize = computed(() => {
    switch (this.size) {
      case 'xs':
        return 14;
      case 'sm':
        return 16;
      case 'lg':
        return 20;
      case 'xl':
        return 24;
      default:
        return 18;
    }
  });

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
