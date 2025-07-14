import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LucideIconData, X } from 'lucide-angular';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-overlay z-40 transition-opacity duration-300"
      [class.opacity-100]="isOpen"
      [class.opacity-0]="!isOpen"
      (click)="onBackdropClick()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          [class]="modalClasses()"
          class="relative transform transition-all duration-300"
          [class.scale-100]="isOpen"
          [class.scale-95]="!isOpen"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          @if (hasHeader) {
          <div
            class="flex items-center justify-between p-6 border-b border-border-muted"
          >
            <div>
              @if (title) {
              <h3 class="text-lg font-semibold text-text-strong">
                {{ title }}
              </h3>
              } @if (subtitle) {
              <p class="text-sm text-text-muted mt-1">{{ subtitle }}</p>
              }
              <ng-content select="[slot=header]"></ng-content>
            </div>

            @if (showCloseButton) {
            <button
              type="button"
              class="text-text-muted hover:text-text-default transition-colors rounded-md p-1"
              (click)="close()"
            >
              <lucide-icon [img]="closeIcon" [size]="20"></lucide-icon>
            </button>
            }
          </div>
          }

          <!-- Content -->
          <div [class]="contentClasses()">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          @if (hasFooter) {
          <div
            class="flex items-center justify-end gap-3 p-6 border-t border-border-muted"
          >
            <ng-content select="[slot=footer]"></ng-content>
          </div>
          }
        </div>
      </div>
    </div>
    }
  `,
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() size: ModalSize = 'md';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() hasHeader = true;
  @Input() hasFooter = false;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;

  @Output() closed = new EventEmitter<void>();

  closeIcon: LucideIconData = X; 

  // Handle escape key effect - moved to field level for proper injection context
  private escapeKeyEffect = effect(() => {
    if (this.isOpen) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  });

  modalClasses = computed(() => `modal-${this.size}`);

  contentClasses = computed(() => {
    const base = 'overflow-y-auto';
    if (this.hasHeader && this.hasFooter) {
      return `${base} p-6`;
    } else if (this.hasHeader || this.hasFooter) {
      return `${base} p-6`;
    }
    return `${base} p-6`;
  });

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }
}
