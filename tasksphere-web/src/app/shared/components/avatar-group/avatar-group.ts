// Location: src/app/shared/components/avatar-group/avatar-group.component.ts

import { Component, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar/avatar';

export interface AvatarData {
  id: string;
  name: string;
  src?: string;
  email?: string;
}

@Component({
  selector: 'app-avatar-group',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="flex items-center">
      <!-- Visible Avatars -->
      @for (avatar of visibleAvatars(); track avatar.id; let i = $index) {
      <div
        class="relative"
        [style.z-index]="avatars.length - i"
        [class]="i > 0 ? getOverlapClasses() : ''"
        [title]="avatar.name"
      >
        <app-avatar
          [src]="avatar?.src ?? ''"
          [name]="avatar.name"
          [size]="size"
          [variant]="shape"
          [border]="true"
        ></app-avatar>
      </div>
      }

      <!-- Overflow Count -->
      @if (overflowCount() > 0) {
      <div [class]="getOverflowClasses()" [title]="getOverflowTooltip()">
        <span [class]="getOverflowTextClasses()"> +{{ overflowCount() }} </span>
      </div>
      }
    </div>
  `,
})
export class AvatarGroupComponent {
  @Input() avatars: AvatarData[] = [];
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'sm';
  @Input() shape: 'circle' | 'square' = 'circle';
  @Input() max: number = 4;

  // Computed properties
  visibleAvatars = computed(() => {
    return this.avatars.slice(0, this.max);
  });

  overflowCount = computed(() => {
    return Math.max(0, this.avatars.length - this.max);
  });

  getOverlapClasses(): string {
    const overlapMap = {
      xs: '-ml-1',
      sm: '-ml-1.5',
      md: '-ml-2',
      lg: '-ml-2.5',
      xl: '-ml-3',
    };
    return overlapMap[this.size];
  }

  getOverflowClasses(): string {
    let classes =
      'relative inline-flex items-center justify-center flex-shrink-0 bg-neutral-200 text-neutral-600 border-2 border-surface font-medium';

    // Add shape classes
    if (this.shape === 'circle') {
      classes += ' rounded-full';
    } else {
      classes += ' rounded-lg';
    }

    // Add size classes
    switch (this.size) {
      case 'xs':
        classes += ' w-6 h-6 text-xs -ml-1';
        break;
      case 'sm':
        classes += ' w-8 h-8 text-xs -ml-1.5';
        break;
      case 'md':
        classes += ' w-10 h-10 text-sm -ml-2';
        break;
      case 'lg':
        classes += ' w-12 h-12 text-sm -ml-2.5';
        break;
      case 'xl':
        classes += ' w-16 h-16 text-base -ml-3';
        break;
    }

    return classes;
  }

  getOverflowTextClasses(): string {
    return 'select-none';
  }

  getOverflowTooltip(): string {
    const hiddenAvatars = this.avatars.slice(this.max);
    return hiddenAvatars.map((avatar) => avatar.name).join(', ');
  }
}
