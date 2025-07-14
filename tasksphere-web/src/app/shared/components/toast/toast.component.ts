import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';
import { ToastMessage } from '../../../core/types';

/**
 * ToastComponent displays application-wide toast notifications
 * Supports different types (success, error, warning, info) with auto-dismiss functionality
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Toast Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="max-w-sm w-full bg-surface border border-border-default rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ease-in-out"
          [class]="getToastClasses(toast.type)"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <!-- Toast Content -->
          <div class="p-4">
            <div class="flex items-start">
              <!-- Icon -->
              <div class="flex-shrink-0">
                @switch (toast.type) {
                  @case ('success') {
                    <lucide-icon [img]="CheckCircle" [size]="20" class="text-success-500"></lucide-icon>
                  }
                  @case ('error') {
                    <lucide-icon [img]="AlertCircle" [size]="20" class="text-danger-500"></lucide-icon>
                  }
                  @case ('warning') {
                    <lucide-icon [img]="AlertTriangle" [size]="20" class="text-warning-500"></lucide-icon>
                  }
                  @case ('info') {
                    <lucide-icon [img]="Info" [size]="20" class="text-primary-500"></lucide-icon>
                  }
                }
              </div>

              <!-- Content -->
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-text-default">
                  {{ toast.title }}
                </p>
                @if (toast.message) {
                  <p class="mt-1 text-sm text-text-muted">
                    {{ toast.message }}
                  </p>
                }

                <!-- Action Button -->
                @if (toast.action) {
                  <div class="mt-3">
                    <button
                      type="button"
                      (click)="handleAction(toast)"
                      class="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                    >
                      {{ toast.action.label }}
                    </button>
                  </div>
                }
              </div>

              <!-- Close Button -->
              <div class="ml-4 flex-shrink-0">
                <button
                  type="button"
                  (click)="dismissToast(toast.id)"
                  class="inline-flex rounded-md p-1.5 text-text-muted hover:text-text-default hover:bg-surface-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [attr.aria-label]="'Dismiss notification'"
                >
                  <lucide-icon [img]="X" [size]="16"></lucide-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Progress Bar (for timed toasts) -->
          @if (toast.duration && toast.duration > 0) {
            <div class="h-1 bg-border-default">
              <div 
                class="h-full transition-all ease-linear"
                [class]="getProgressBarClasses(toast.type)"
                [style.animation]="'toast-progress ' + toast.duration + 'ms linear'"
              ></div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Toast Animations -->
    <style>
      @keyframes toast-progress {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
    </style>
  `,
})
export class ToastComponent {
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly Info = Info;

  readonly toastService = inject(ToastService);

  /**
   * Gets CSS classes for toast based on type
   * @param type - Toast type
   * @returns CSS classes string
   */
  getToastClasses(type: ToastMessage['type']): string {
    const baseClasses = 'animate-slide-in-right';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-l-success-500`;
      case 'error':
        return `${baseClasses} border-l-4 border-l-danger-500`;
      case 'warning':
        return `${baseClasses} border-l-4 border-l-warning-500`;
      case 'info':
        return `${baseClasses} border-l-4 border-l-primary-500`;
      default:
        return baseClasses;
    }
  }

  /**
   * Gets CSS classes for progress bar based on type
   * @param type - Toast type
   * @returns CSS classes string
   */
  getProgressBarClasses(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'bg-success-500';
      case 'error':
        return 'bg-danger-500';
      case 'warning':
        return 'bg-warning-500';
      case 'info':
        return 'bg-primary-500';
      default:
        return 'bg-neutral-500';
    }
  }

  /**
   * Handles action button click
   * @param toast - Toast message with action
   */
  handleAction(toast: ToastMessage): void {
    if (toast.action) {
      toast.action.handler();
      this.dismissToast(toast.id);
    }
  }

  /**
   * Dismisses a toast by ID
   * @param id - Toast ID to dismiss
   */
  dismissToast(id: string): void {
    this.toastService.remove(id);
  }
}