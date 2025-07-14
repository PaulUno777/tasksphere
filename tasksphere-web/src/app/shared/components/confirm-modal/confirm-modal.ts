// Location: src/app/shared/components/confirm-modal/confirm-modal.component.ts

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Info, CheckCircle, X, Loader2 } from 'lucide-angular';
import { ModalComponent } from '../modal/modal';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ModalComponent],
  template: `
    <app-modal
      [title]="title"
      [size]="'sm'"
      [showCloseButton]="false"
      (close)="onCancel()"
    >
      <div class="space-y-4">
        <!-- Icon -->
        <div class="flex justify-center">
          <div [class]="getIconContainerClasses()">
            <lucide-icon 
              [img]="getIcon()" 
              [size]="24" 
              [class]="getIconClasses()"
            ></lucide-icon>
          </div>
        </div>

        <!-- Message -->
        <div class="text-center">
          <p class="text-text-default">{{ message }}</p>
        </div>

        <!-- Confirmation Input -->
        @if (requireConfirmation && confirmationText) {
          <div class="space-y-2">
            <label class="block text-sm font-medium text-text-default">
              {{ getConfirmationLabel() }}
            </label>
            <input
              type="text"
              [(ngModel)]="confirmationInput"
              [placeholder]="confirmationText"
              class="input-default w-full"
              [class.border-danger-500]="showValidationError()"
            />
            @if (showValidationError()) {
              <p class="text-sm text-danger-600">
                {{ getValidationErrorMessage() }}
              </p>
            }
          </div>
        }

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="loading"
            class="btn-ghost btn-md"
          >
            {{ cancelText }}
          </button>
          
          <button
            type="button"
            (click)="onConfirm()"
            [disabled]="loading || !canConfirm()"
            [class]="getConfirmButtonClasses()"
          >
            @if (loading) {
              <lucide-icon [img]="Loader2" [size]="16" class="mr-2 animate-spin"></lucide-icon>
            }
            {{ confirmText }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class ConfirmModalComponent {
  // Icons
  readonly AlertTriangle = AlertTriangle;
  readonly Info = Info;
  readonly CheckCircle = CheckCircle;
  readonly X = X;
  readonly Loader2 = Loader2;

  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() variant: 'info' | 'warning' | 'danger' | 'success' = 'info';
  @Input() loading: boolean = false;
  @Input() requireConfirmation: boolean = false;
  @Input() confirmationText?: string;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  confirmationInput = signal('');
  showValidationError = signal(false);

  onConfirm() {
    if (this.requireConfirmation && this.confirmationText) {
      if (this.confirmationInput() !== this.confirmationText) {
        this.showValidationError.set(true);
        return;
      }
    }
    
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  canConfirm(): boolean {
    if (this.requireConfirmation && this.confirmationText) {
      return this.confirmationInput() === this.confirmationText;
    }
    return true;
  }

  getIcon() {
    switch (this.variant) {
      case 'warning':
        return this.AlertTriangle;
      case 'danger':
        return this.AlertTriangle;
      case 'success':
        return this.CheckCircle;
      case 'info':
      default:
        return this.Info;
    }
  }

  getIconContainerClasses(): string {
    let classes = 'w-12 h-12 rounded-full flex items-center justify-center';
    
    switch (this.variant) {
      case 'warning':
        classes += ' bg-warning-100';
        break;
      case 'danger':
        classes += ' bg-danger-100';
        break;
      case 'success':
        classes += ' bg-success-100';
        break;
      case 'info':
      default:
        classes += ' bg-primary-100';
        break;
    }
    
    return classes;
  }

  getIconClasses(): string {
    switch (this.variant) {
      case 'warning':
        return 'text-warning-600';
      case 'danger':
        return 'text-danger-600';
      case 'success':
        return 'text-success-600';
      case 'info':
      default:
        return 'text-primary-600';
    }
  }

  getConfirmButtonClasses(): string {
    let classes = 'btn-md';
    
    switch (this.variant) {
      case 'danger':
        classes += ' btn-danger';
        break;
      case 'warning':
        classes += ' bg-warning-600 text-white hover:bg-warning-700';
        break;
      case 'success':
        classes += ' btn-success';
        break;
      case 'info':
      default:
        classes += ' btn-primary';
        break;
    }
    
    return classes;
  }

  getConfirmationLabel(): string {
    return `Type "${this.confirmationText}" to confirm`;
  }

  getValidationErrorMessage(): string {
    return `Please type "${this.confirmationText}" to confirm this action`;
  }
}