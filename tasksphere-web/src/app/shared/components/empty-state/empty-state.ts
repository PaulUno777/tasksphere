import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Folder,
  Search,
  Plus,
  Archive,
  Trash2,
  Users,
  AlertCircle,
} from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="text-center py-12">
      <!-- Icon -->
      <div
        class="mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-surface-muted"
      >
        <lucide-icon
          [img]="getIcon()"
          [size]="32"
          class="text-text-muted"
        ></lucide-icon>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-semibold text-text-default mb-2">
        {{ title }}
      </h3>

      <!-- Description -->
      @if (description) {
      <p class="text-text-muted mb-6 max-w-md mx-auto">
        {{ description }}
      </p>
      }

      <!-- Action Button -->
      @if (actionText) {
      <button (click)="onAction()" class="btn-primary btn-md">
        @if (icon === 'Plus') {
        <lucide-icon [img]="Plus" [size]="16" class="mr-2"></lucide-icon>
        }
        {{ actionText }}
      </button>
      }

      <!-- Secondary Action -->
      @if (secondaryActionText) {
      <button (click)="onSecondaryAction()" class="btn-ghost btn-md ml-3">
        {{ secondaryActionText }}
      </button>
      }

      <!-- Additional Content -->
      <div class="mt-6">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  // Icons
  readonly Folder = Folder;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Archive = Archive;
  readonly Trash2 = Trash2;
  readonly Users = Users;
  readonly AlertCircle = AlertCircle;

  @Input() icon: string = 'Folder';
  @Input() title: string = '';
  @Input() description?: string;
  @Input() actionText?: string;
  @Input() secondaryActionText?: string;

  @Output() action = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();

  onAction() {
    this.action.emit();
  }

  onSecondaryAction() {
    this.secondaryAction.emit();
  }

  getIcon() {
    const iconMap: Record<string, any> = {
      Folder: this.Folder,
      Search: this.Search,
      Plus: this.Plus,
      Archive: this.Archive,
      Trash2: this.Trash2,
      Users: this.Users,
      AlertCircle: this.AlertCircle,
    };
    return iconMap[this.icon] || this.Folder;
  }
}
