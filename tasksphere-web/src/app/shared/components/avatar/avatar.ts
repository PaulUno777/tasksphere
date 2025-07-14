import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarVariant = 'circle' | 'square' | 'rounded';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="avatarClasses()">
      @if (src && !imageError) {
      <img
        [src]="src"
        [alt]="alt || name"
        [class]="imageClasses()"
        (error)="onImageError()"
      />
      } @else {
      <div
        [class]="fallbackClasses()"
        [style.background-color]="backgroundColor"
      >
        <span [class]="initialsClasses()">{{ initials() }}</span>
      </div>
      } @if (showStatus) {
      <div [class]="statusClasses()">
        <div [class]="statusDotClasses()"></div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      @utility avatar-base {
        @apply relative inline-flex items-center justify-center flex-shrink-0;
      }

      @utility avatar-circle {
        @apply avatar-base rounded-full;
      }

      @utility avatar-square {
        @apply avatar-base;
      }

      @utility avatar-rounded {
        @apply avatar-base rounded-lg;
      }

      @utility avatar-xs {
        @apply w-6 h-6;
      }

      @utility avatar-sm {
        @apply w-8 h-8;
      }

      @utility avatar-md {
        @apply w-10 h-10;
      }

      @utility avatar-lg {
        @apply w-12 h-12;
      }

      @utility avatar-xl {
        @apply w-16 h-16;
      }

      @utility avatar-2xl {
        @apply w-20 h-20;
      }
    `,
  ],
})
export class AvatarComponent {
  @Input() src = '';
  @Input() name = '';
  @Input() alt = '';
  @Input() size: AvatarSize = 'md';
  @Input() variant: AvatarVariant = 'circle';
  @Input() backgroundColor = '';
  @Input() showStatus = false;
  @Input() statusType: 'online' | 'offline' | 'busy' | 'away' = 'offline';
  @Input() border: boolean = false;

  imageError = false;

  avatarClasses = computed(() => {
    const base = `avatar-${this.variant} avatar-${this.size}`;
    return this.border ? `${base} ring-2 ring-default` : base;
  });

  imageClasses = computed(() => {
    const base = 'w-full h-full object-cover';
    switch (this.variant) {
      case 'circle':
        return `${base} rounded-full`;
      case 'square':
        return base;
      case 'rounded':
        return `${base} rounded-lg`;
      default:
        return base;
    }
  });

  fallbackClasses = computed(() => {
    const base =
      'w-full h-full flex items-center justify-center text-white font-medium';
    switch (this.variant) {
      case 'circle':
        return `${base} rounded-full`;
      case 'square':
        return base;
      case 'rounded':
        return `${base} rounded-lg`;
      default:
        return base;
    }
  });

  initialsClasses = computed(() => {
    switch (this.size) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      case 'xl':
        return 'text-lg';
      case '2xl':
        return 'text-xl';
      default:
        return 'text-sm';
    }
  });

  statusClasses = computed(() => {
    const base =
      'absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4';
    switch (this.variant) {
      case 'circle':
        return `${base} rounded-full`;
      case 'square':
        return base;
      case 'rounded':
        return `${base} rounded-full`;
      default:
        return base;
    }
  });

  statusDotClasses = computed(() => {
    const sizeClass =
      this.size === 'xs' || this.size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
    const base = `${sizeClass} rounded-full border-2 border-surface`;

    switch (this.statusType) {
      case 'online':
        return `${base} bg-success-500`;
      case 'busy':
        return `${base} bg-danger-500`;
      case 'away':
        return `${base} bg-warning-500`;
      case 'offline':
        return `${base} bg-neutral-400`;
      default:
        return `${base} bg-neutral-400`;
    }
  });

  initials = computed(() => {
    if (!this.name) return '?';
    return this.name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  });

  onImageError(): void {
    this.imageError = true;
  }
}
