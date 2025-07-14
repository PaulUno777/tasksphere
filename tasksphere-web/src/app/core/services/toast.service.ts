import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '@core/types';

/**
 * ToastService manages application-wide toast notifications
 * Provides methods to show success, error, warning, and info messages
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // Reactive toast state
  readonly toasts = signal<ToastMessage[]>([]);

  private toastIdCounter = 0;

  /**
   * Shows a success toast message
   * @param title - Toast title
   * @param message - Optional toast message
   * @param duration - Duration in milliseconds (default: 5000)
   */
  success(title: string, message?: string, duration = 5000): void {
    this.addToast({
      type: 'success',
      title,
      message,
      duration,
    });
  }

  /**
   * Shows an error toast message
   * @param title - Toast title
   * @param message - Optional toast message
   * @param duration - Duration in milliseconds (default: 7000)
   */
  error(title: string, message?: string, duration = 7000): void {
    this.addToast({
      type: 'error',
      title,
      message,
      duration,
    });
  }

  /**
   * Shows a warning toast message
   * @param title - Toast title
   * @param message - Optional toast message
   * @param duration - Duration in milliseconds (default: 6000)
   */
  warning(title: string, message?: string, duration = 6000): void {
    this.addToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  }

  /**
   * Shows an info toast message
   * @param title - Toast title
   * @param message - Optional toast message
   * @param duration - Duration in milliseconds (default: 5000)
   */
  info(title: string, message?: string, duration = 5000): void {
    this.addToast({
      type: 'info',
      title,
      message,
      duration,
    });
  }

  /**
   * Shows a toast message with custom configuration
   * @param config - Toast configuration
   */
  show(config: Omit<ToastMessage, 'id'>): void {
    this.addToast(config);
  }

  /**
   * Removes a specific toast by ID
   * @param id - Toast ID to remove
   */
  remove(id: string): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /**
   * Removes all toasts
   */
  clear(): void {
    this.toasts.set([]);
  }

  /**
   * Adds a new toast to the list
   * @param config - Toast configuration without ID
   */
  private addToast(config: Omit<ToastMessage, 'id'>): void {
    const toast: ToastMessage = {
      ...config,
      id: this.generateToastId(),
    };

    // Add toast to the list
    this.toasts.update((toasts) => [...toasts, toast]);

    // Auto-remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }
  }

  /**
   * Generates a unique toast ID
   * @returns Unique toast ID
   */
  private generateToastId(): string {
    return `toast-${++this.toastIdCounter}-${Date.now()}`;
  }
}
