import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  LucideIconData,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-angular';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div [class]="alertClasses()" role="alert">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <lucide-icon
            [img]="alertIcon()"
            [size]="20"
            [class]="iconClasses()"
          ></lucide-icon>
        </div>

        <div class="ml-3 flex-1">
          @if (title) {
          <h3 [class]="titleClasses()">{{ title }}</h3>
          } @if (message) {
          <p [class]="messageClasses()">{{ message }}</p>
          } @else {
          <div [class]="messageClasses()">
            <ng-content></ng-content>
          </div>
          }
        </div>

        @if (dismissible) {
        <div class="ml-auto pl-3">
          <button
            type="button"
            [class]="dismissButtonClasses()"
            (click)="onDismiss()"
          >
            <lucide-icon [img]="closeIcon" [size]="16"></lucide-icon>
          </button>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
     
    `,
  ],
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() dismissible = false;

  @Output() dismissed = new EventEmitter<void>();

  // Icons (import from lucide-angular)
  infoIcon = Info;
  checkCircleIcon = CheckCircle;
  alertTriangleIcon = AlertTriangle;
  alertCircleIcon = AlertCircle;
  closeIcon = X;

  alertClasses = computed(() => `alert-${this.variant}`);

  alertIcon = computed(() => {
    switch (this.variant) {
      case 'success':
        return this.checkCircleIcon;
      case 'warning':
        return this.alertTriangleIcon;
      case 'danger':
        return this.alertCircleIcon;
      default:
        return this.infoIcon;
    }
  });

  iconClasses = computed(() => {
    switch (this.variant) {
      case 'success':
        return 'text-success-500';
      case 'warning':
        return 'text-warning-500';
      case 'danger':
        return 'text-danger-500';
      default:
        return 'text-primary-500';
    }
  });

  titleClasses = computed(() => {
    const base = 'text-sm font-medium';
    switch (this.variant) {
      case 'success':
        return `${base} text-success-800`;
      case 'warning':
        return `${base} text-warning-800`;
      case 'danger':
        return `${base} text-danger-800`;
      default:
        return `${base} text-primary-800`;
    }
  });

  messageClasses = computed(() => {
    const base = 'text-sm';
    const marginClass = this.title ? 'mt-1' : '';
    switch (this.variant) {
      case 'success':
        return `${base} ${marginClass} text-success-700`;
      case 'warning':
        return `${base} ${marginClass} text-warning-700`;
      case 'danger':
        return `${base} ${marginClass} text-danger-700`;
      default:
        return `${base} ${marginClass} text-primary-700`;
    }
  });

  dismissButtonClasses = computed(() => {
    const base =
      'inline-flex rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    switch (this.variant) {
      case 'success':
        return `${base} text-success-500 hover:bg-success-100 focus:ring-success-500`;
      case 'warning':
        return `${base} text-warning-500 hover:bg-warning-100 focus:ring-warning-500`;
      case 'danger':
        return `${base} text-danger-500 hover:bg-danger-100 focus:ring-danger-500`;
      default:
        return `${base} text-primary-500 hover:bg-primary-100 focus:ring-primary-500`;
    }
  });

  onDismiss(): void {
    this.dismissed.emit();
  }
}
