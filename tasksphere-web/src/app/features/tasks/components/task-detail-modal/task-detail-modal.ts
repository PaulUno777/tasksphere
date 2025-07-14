import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Calendar,
  User,
  Flag,
  MessageSquare,
  Edit3,
  Save,
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
} from 'lucide-angular';
import { Task } from '@core/models/task.model';
import { TaskStatus, TaskPriority } from '@core/types';
import { ModalComponent } from '@shared/components/modal/modal';
import { AvatarComponent } from '@shared/components/avatar/avatar';
import { BadgeComponent } from '@shared/components/badge/badge';
import { ButtonComponent } from '@shared/components/button/button';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ModalComponent,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="'Task Details'"
      (close)="onClose()"
      size="lg"
    >
      @if (task) {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Priority & Status -->
            <div class="flex items-center gap-3 mb-3">
              <app-badge
                [variant]="getPriorityVariant(task.priority)"
                size="sm"
              >
                <lucide-icon
                  [img]="Flag"
                  [size]="12"
                  class="mr-1"
                ></lucide-icon>
                {{ task.priority }}
              </app-badge>

              <app-badge [variant]="getStatusVariant(task.status)" size="sm">
                {{ getStatusLabel(task.status) }}
              </app-badge>

              @if (task.isOverdue) {
              <app-badge variant="danger" size="sm">
                <lucide-icon
                  [img]="AlertTriangle"
                  [size]="12"
                  class="mr-1"
                ></lucide-icon>
                Overdue
              </app-badge>
              }
            </div>

            <!-- Title -->
            @if (isEditing()) {
            <input
              type="text"
              [(ngModel)]="editForm.title"
              class="w-full text-xl font-semibold bg-transparent border-b border-border-default focus:outline-none focus:border-primary-500 pb-1 mb-3"
              placeholder="Task title..."
            />
            } @else {
            <h2 class="text-xl font-semibold text-text-default mb-3">
              {{ task.title }}
            </h2>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            @if (task.canEdit) { @if (isEditing()) {
            <app-button
              variant="primary"
              size="sm"
              (click)="saveChanges()"
              [disabled]="isSaving()"
            >
              <lucide-icon [img]="Save" [size]="16" class="mr-1"></lucide-icon>
              Save
            </app-button>
            <app-button variant="secondary" size="sm" (click)="cancelEditing()">
              Cancel
            </app-button>
            } @else {
            <app-button variant="secondary" size="sm" (click)="startEditing()">
              <lucide-icon [img]="Edit3" [size]="16" class="mr-1"></lucide-icon>
              Edit
            </app-button>
            } }
          </div>
        </div>

        <!-- Description -->
        <div>
          <h3 class="text-sm font-medium text-text-default mb-2">
            Description
          </h3>
          @if (isEditing()) {
          <textarea
            [(ngModel)]="editForm.description"
            rows="4"
            class="w-full p-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Add a description..."
          ></textarea>
          } @else {
          <div class="p-3 bg-surface-muted rounded-lg">
            @if (task.description) {
            <p class="text-text-default whitespace-pre-wrap">
              {{ task.description }}
            </p>
            } @else {
            <p class="text-text-muted italic">No description provided</p>
            }
          </div>
          }
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-4">
            <!-- Assignees -->
            <div>
              <h3 class="text-sm font-medium text-text-default mb-2">
                Assigned To
              </h3>
              @if (task.assignees && task.assignees.length > 0) {
              <div class="space-y-2">
                @for (assignee of task.assignees; track assignee.id) {
                <div class="flex items-center gap-3">
                  <app-avatar
                    [src]="assignee?.avatarUrl || ''"
                    [name]="assignee.fullName"
                    size="sm"
                  />
                  <span class="text-text-default">{{ assignee.fullName }}</span>
                </div>
                }
              </div>
              } @else {
              <div class="flex items-center gap-2 text-text-muted">
                <lucide-icon [img]="User" [size]="16"></lucide-icon>
                <span>Unassigned</span>
              </div>
              }
            </div>

            <!-- Due Date -->
            <div>
              <h3 class="text-sm font-medium text-text-default mb-2">
                Due Date
              </h3>
              @if (task.dueDate) {
              <div class="flex items-center gap-2">
                <lucide-icon
                  [img]="Calendar"
                  [size]="16"
                  [class.text-danger-500]="task.isOverdue"
                  [class.text-text-muted]="!task.isOverdue"
                ></lucide-icon>
                <span
                  [class.text-danger-600]="task.isOverdue"
                  [class.text-text-default]="!task.isOverdue"
                >
                  {{ formatDateTime(task.dueDate) }}
                </span>
              </div>
              } @else {
              <div class="flex items-center gap-2 text-text-muted">
                <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
                <span>No due date</span>
              </div>
              }
            </div>

            <!-- Board -->
            <div>
              <h3 class="text-sm font-medium text-text-default mb-2">Board</h3>
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  [style.background-color]="task.board.color || '#6b7280'"
                ></div>
                <span class="text-text-default">{{ task.board.title }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <!-- Created By -->
            <div>
              <h3 class="text-sm font-medium text-text-default mb-2">
                Created By
              </h3>
              <div class="flex items-center gap-3">
                <app-avatar
                  [src]="task.createdBy.avatarUrl || ''"
                  [name]="task.createdBy.fullName"
                  size="sm"
                />
                <div>
                  <div class="text-text-default">
                    {{ task.createdBy.fullName }}
                  </div>
                  <div class="text-sm text-text-muted">
                    {{ formatDateTime(task.createdAt) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Last Edited -->
            @if (task.lastEditedBy && task.updatedAt !== task.createdAt) {
            <div>
              <h3 class="text-sm font-medium text-text-default mb-2">
                Last Edited By
              </h3>
              <div class="flex items-center gap-3">
                <app-avatar
                  [src]="task.lastEditedBy.avatarUrl || ''"
                  [name]="task.lastEditedBy.fullName"
                  size="sm"
                />
                <div>
                  <div class="text-text-default">
                    {{ task.lastEditedBy.fullName }}
                  </div>
                  <div class="text-sm text-text-muted">
                    {{ formatDateTime(task.updatedAt) }}
                  </div>
                </div>
              </div>
            </div>
            }

            <!-- Comments -->
            <div>
              <h3 class="text-sm font-medium text-text-default mb-2">
                Comments
              </h3>
              <div class="flex items-center gap-2 text-text-muted">
                <lucide-icon [img]="MessageSquare" [size]="16"></lucide-icon>
                <span
                  >{{ task.commentCount }} comment{{
                    task.commentCount !== 1 ? 's' : ''
                  }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Status Change Actions -->
        @if (task.canEdit && task.status !== 'COMPLETED') {
        <div class="border-t border-border-default pt-6">
          <h3 class="text-sm font-medium text-text-default mb-3">
            Quick Actions
          </h3>
          <div class="flex flex-wrap gap-2">
            @if (task.status !== 'IN_PROGRESS') {
            <app-button
              variant="secondary"
              size="sm"
              (click)="updateStatus('IN_PROGRESS')"
            >
              <lucide-icon [img]="Clock" [size]="16" class="mr-1"></lucide-icon>
              Start Progress
            </app-button>
            } @if (task.status !== 'REVIEW') {
            <app-button
              variant="secondary"
              size="sm"
              (click)="updateStatus('REVIEW')"
            >
              <lucide-icon
                [img]="AlertTriangle"
                [size]="16"
                class="mr-1"
              ></lucide-icon>
              Move to Review
            </app-button>
            }

            <app-button
              variant="success"
              size="sm"
              (click)="updateStatus('COMPLETED')"
            >
              <lucide-icon
                [img]="CheckCircle"
                [size]="16"
                class="mr-1"
              ></lucide-icon>
              Mark Complete
            </app-button>
          </div>
        </div>
        }

        <!-- Danger Zone -->
        @if (task.canEdit) {
        <div class="border-t border-border-default pt-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-text-default">Danger Zone</h3>
              <p class="text-sm text-text-muted">
                Delete this task permanently
              </p>
            </div>
            <app-button variant="danger" size="sm" (click)="confirmDelete()">
              <lucide-icon
                [img]="Trash2"
                [size]="16"
                class="mr-1"
              ></lucide-icon>
              Delete Task
            </app-button>
          </div>
        </div>
        }
      </div>
      }
    </app-modal>
  `,
})
export class TaskDetailModalComponent {
  @Input({ required: true }) task!: Task | null;
  @Input({ required: true }) isOpen!: boolean;
  @Output() close = new EventEmitter<void>();
  @Output() taskUpdate = new EventEmitter<Task>();

  // Icons
  readonly X = X;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly Flag = Flag;
  readonly MessageSquare = MessageSquare;
  readonly Edit3 = Edit3;
  readonly Save = Save;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly Trash2 = Trash2;

  // State
  isEditing = signal(false);
  isSaving = signal(false);
  editForm = {
    title: '',
    description: '',
  };

  onClose() {
    this.isEditing.set(false);
    this.close.emit();
  }

  startEditing() {
    if (this.task) {
      this.editForm = {
        title: this.task.title,
        description: this.task.description || '',
      };
      this.isEditing.set(true);
    }
  }

  cancelEditing() {
    this.isEditing.set(false);
  }

  saveChanges() {
    if (!this.task) return;

    this.isSaving.set(true);

    // TODO: Implement actual save logic with API call
    setTimeout(() => {
      const updatedTask = {
        ...this.task!,
        title: this.editForm.title,
        description: this.editForm.description,
        updatedAt: new Date().toISOString(),
      };

      this.taskUpdate.emit(updatedTask);
      this.isEditing.set(false);
      this.isSaving.set(false);
    }, 1000);
  }

  updateStatus(newStatus: TaskStatus) {
    if (!this.task) return;

    const updatedTask = {
      ...this.task,
      status: newStatus,
      completedAt:
        newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.taskUpdate.emit(updatedTask);
  }

  confirmDelete() {
    if (!this.task) return;

    const confirmed = confirm(
      'Are you sure you want to delete this task? This action cannot be undone.'
    );
    if (confirmed) {
      // TODO: Implement delete logic
      console.log('Delete task:', this.task.id);
      this.onClose();
    }
  }

  getPriorityVariant(
    priority: TaskPriority
  ): 'success' | 'warning' | 'danger' | 'secondary' {
    switch (priority) {
      case 'LOW':
        return 'secondary';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusVariant(
    status: TaskStatus
  ): 'success' | 'warning' | 'danger' | 'secondary' | 'primary' {
    switch (status) {
      case 'TODO':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'primary';
      case 'REVIEW':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'REVIEW':
        return 'Review';
      case 'COMPLETED':
        return 'Completed';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return status;
    }
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
