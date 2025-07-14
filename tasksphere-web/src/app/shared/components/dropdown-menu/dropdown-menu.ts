import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: any;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  type?: 'item' | 'divider';
  action?: () => void;
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative" #dropdownContainer>
      <!-- Trigger -->
      <div (click)="toggle()" #trigger>
        <ng-content></ng-content>
      </div>

      <!-- Menu -->
      @if (isOpen()) {
      <div
        class="absolute z-50 min-w-48 bg-surface border border-border-default rounded-lg shadow-lg py-1"
        [class]="getPositionClasses()"
        #menu
      >
        @for (item of items; track item.id) { @if (item.type === 'divider') {
        <div class="h-px bg-border-default my-1"></div>
        } @else {
        <button
          type="button"
          (click)="onItemClick(item)"
          [disabled]="item.disabled"
          class="flex items-center w-full px-3 py-2 text-left text-sm transition-colors"
          [class]="getItemClasses(item)"
        >
          @if (item.icon) {
          <lucide-icon
            [img]="item.icon"
            [size]="16"
            class="mr-3 flex-shrink-0"
          ></lucide-icon>
          }
          <span>{{ item.label }}</span>
        </button>
        } }
      </div>
      }
    </div>
  `,
})
export class DropdownMenuComponent {
  @Input() items: DropdownMenuItem[] = [];
  @Input() trigger: 'click' | 'hover' = 'click';
  @Input() placement: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' =
    'bottom-start';

  @Output() itemClick = new EventEmitter<DropdownMenuItem>();

  @ViewChild('dropdownContainer', { static: false })
  dropdownContainer!: ElementRef;
  @ViewChild('trigger', { static: false }) triggerRef!: ElementRef;
  @ViewChild('menu', { static: false }) menuRef!: ElementRef;

  isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.dropdownContainer?.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  toggle() {
    if (this.trigger === 'click') {
      this.isOpen.update((open) => !open);
    }
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  onItemClick(item: DropdownMenuItem) {
    if (item.disabled) return;

    this.itemClick.emit(item);
    item.action?.();
    this.close();
  }

  getPositionClasses(): string {
    const positionClasses = {
      'bottom-start': 'top-full left-0 mt-1',
      'bottom-end': 'top-full right-0 mt-1',
      'top-start': 'bottom-full left-0 mb-1',
      'top-end': 'bottom-full right-0 mb-1',
    };
    return positionClasses[this.placement];
  }

  getItemClasses(item: DropdownMenuItem): string {
    let classes = '';

    if (item.disabled) {
      classes += 'opacity-50 cursor-not-allowed';
    } else {
      if (item.variant === 'danger') {
        classes += 'text-danger-600 hover:bg-danger-50 hover:text-danger-700';
      } else {
        classes += 'text-text-default hover:bg-surface-muted';
      }
    }

    return classes;
  }
}
