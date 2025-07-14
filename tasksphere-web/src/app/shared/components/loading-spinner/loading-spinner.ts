import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div [class]="getContainerClasses()">
      <lucide-icon
        [img]="Loader2"
        [size]="getIconSize()"
        class="animate-spin text-primary-500"
      ></lucide-icon>

      @if (message) {
      <p [class]="getMessageClasses()">{{ message }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly Loader2 = Loader2;

  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() message?: string;
  @Input() center: boolean = true;

  getContainerClasses(): string {
    let classes = 'flex items-center';

    if (this.center) {
      classes += ' justify-center';
    }

    if (this.message) {
      classes += ' flex-col space-y-2';
    }

    return classes;
  }

  getIconSize(): number {
    const sizes = {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 40,
    };
    return sizes[this.size];
  }

  getMessageClasses(): string {
    let classes = 'text-text-muted font-medium';

    switch (this.size) {
      case 'xs':
        classes += ' text-xs';
        break;
      case 'sm':
        classes += ' text-sm';
        break;
      case 'md':
        classes += ' text-sm';
        break;
      case 'lg':
        classes += ' text-base';
        break;
      case 'xl':
        classes += ' text-lg';
        break;
    }

    return classes;
  }
}
