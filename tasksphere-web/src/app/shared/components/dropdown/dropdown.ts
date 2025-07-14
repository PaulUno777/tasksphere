import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: any;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative inline-block text-left">
      <!-- Trigger -->
      <div>
        <button
          type="button"
          [class]="triggerClasses()"
          (click)="toggle()"
          [disabled]="disabled"
        >
          <ng-content select="[slot=trigger]"></ng-content>
          @if (!hasCustomTrigger) {
            <span>{{ placeholder }}</span>
            <lucide-icon [img]="chevronDownIcon" [size]="16" class="ml-2"></lucide-icon>
          }
        </button>
      </div>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div [class]="menuClasses()">
          <div class="py-1">
            @for (item of items; track item.id) {
              @if (item.divider) {
                <div class="border-t border-border-muted my-1"></div>
              } @else {
                <button
                  type="button"
                  [class]="itemClasses()"
                  [disabled]="item.disabled"
                  (click)="selectItem(item)"
                >
                  @if (item.icon) {
                    <lucide-icon [img]="item.icon" [size]="16" class="mr-2"></lucide-icon>
                  }
                  {{ item.label }}
                </button>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @utility dropdown-trigger {
      @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text-default 
             bg-surface border border-border-default rounded-md hover:bg-surface-muted 
             focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors;
    }

    @utility dropdown-menu {
      @apply absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-surface shadow-lg 
             ring-1 ring-border-default focus:outline-none;
    }

    @utility dropdown-item {
      @apply flex items-center w-full px-4 py-2 text-sm text-text-default hover:bg-surface-muted 
             transition-colors text-left;
    }

    @utility dropdown-item-disabled {
      @apply dropdown-item opacity-50 cursor-not-allowed;
    }
  `]
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() placeholder = 'Select...';
  @Input() disabled = false;
  @Input() hasCustomTrigger = false;

  @Output() itemSelected = new EventEmitter<DropdownItem>();

  isOpen = signal(false);
  chevronDownIcon: any; // Import from lucide-angular

  triggerClasses = computed(() => {
    const base = 'dropdown-trigger';
    const classes = [base];
    
    if (this.disabled) classes.push('opacity-50 cursor-not-allowed');
    
    return classes.join(' ');
  });

  menuClasses = computed(() => 'dropdown-menu');

  itemClasses = computed(() => (item: DropdownItem) => {
    return item.disabled ? 'dropdown-item-disabled' : 'dropdown-item';
  });

  toggle(): void {
    if (!this.disabled) {
      this.isOpen.update(open => !open);
    }
  }

  selectItem(item: DropdownItem): void {
    if (!item.disabled) {
      this.itemSelected.emit(item);
      this.isOpen.set(false);
    }
  }
}