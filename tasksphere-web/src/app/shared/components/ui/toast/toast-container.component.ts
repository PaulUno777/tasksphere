import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let toast of notificationService.toastMessages()"
        class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 animate-slide-up"
        [class]="getToastClasses(toast.type)"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <lucide-icon
                [name]="getToastIcon(toast.type)"
                [class]="getIconClasses(toast.type)"
                size="20"
              >
              </lucide-icon>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">{{ toast.title }}</p>
              <p *ngIf="toast.message" class="mt-1 text-sm text-gray-500">
                {{ toast.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <app-button
                variant="ghost"
                size="sm"
                icon="x"
                (clicked)="notificationService.removeToast(toast.id)"
                class="text-gray-400 hover:text-gray-600"
              ></app-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ToastContainerComponent {
  notificationService = inject(NotificationService);

  getToastClasses(type: string): string {
    const baseClasses = 'border-l-4';
    const typeClasses = {
      success: 'border-success-500',
      error: 'border-danger-500',
      warning: 'border-warning-500',
      info: 'border-primary-500',
    };
    return `${baseClasses} ${
      typeClasses[type as keyof typeof typeClasses] || typeClasses.info
    }`;
  }

  getToastIcon(type: string): string {
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info',
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  getIconClasses(type: string): string {
    const classes = {
      success: 'text-success-500',
      error: 'text-danger-500',
      warning: 'text-warning-500',
      info: 'text-primary-500',
    };
    return classes[type as keyof typeof classes] || classes.info;
  }
}
