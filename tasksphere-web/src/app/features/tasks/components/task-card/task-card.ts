import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Calendar,
  User,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  MoreVertical,
} from 'lucide-angular';
import { Task } from '@core/models/task.model';
import { TaskStatus, TaskPriority } from '@core/types';
import { AvatarComponent } from '@shared/components/avatar/avatar';
import { BadgeComponent } from '@shared/components/badge/badge';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AvatarComponent, BadgeComponent],
  template: `
    <div
      class="task-card"
      [class.task-card-overdue]="task.isOverdue"
      [class.task-card-high-priority]="
        task.priority === 'HIGH' || task.priority === 'CRITICAL'
      "
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <!-- Priority Indicator -->
          @if (task.priority && task.priority !== 'LOW') {
          <div class="flex items-center mb-2">
            <div
              class="w-2 h-2 rounded-full mr-2"
              [class.bg-yellow-500]="task.priority === 'MEDIUM'"
              [class.bg-orange-500]="task.priority === 'HIGH'"
              [class.bg-red-500]="task.priority === 'CRITICAL'"
            ></div>
            <span
              class="text-xs font-medium uppercase tracking-wide"
              [class.text-yellow-600]="task.priority === 'MEDIUM'"
              [class.text-orange-600]="task.priority === 'HIGH'"
              [class.text-red-600]="task.priority === 'CRITICAL'"
            >
              {{ task.priority }}
            </span>
          </div>
          }

          <!-- Title -->
          <h4
            class="font-medium text-text-default leading-tight mb-1 line-clamp-2"
          >
            {{ task.title }}
          </h4>

          <!-- Description -->
          @if (task.description) {
          <p class="text-sm text-text-muted line-clamp-2">
            {{ task.description }}
          </p>
          }
        </div>

        <!-- Actions Menu -->
        <button class="task-card-menu-btn" (click)="onMenuClick($event)">
          <lucide-icon [img]="MoreVertical" [size]="16"></lucide-icon>
        </button>
      </div>

      <!-- Category -->
      @if (task.categoryId) {
      <div class="mb-3">
        <app-badge variant="secondary" size="sm" class="text-xs">
          Category
        </app-badge>
      </div>
      }

      <!-- Due Date -->
      @if (task.dueDate) {
      <div class="flex items-center mb-3">
        <lucide-icon
          [img]="Calendar"
          [size]="14"
          [class.text-danger-500]="task.isOverdue"
          [class.text-text-muted]="!task.isOverdue"
          class="mr-2"
        ></lucide-icon>
        <span
          class="text-sm"
          [class.text-danger-600]="task.isOverdue"
          [class.text-text-muted]="!task.isOverdue"
        >
          {{ formatDate(task.dueDate) }}
          @if (task.isOverdue) {
          <span class="text-xs font-medium ml-1">(Overdue)</span>
          }
        </span>
      </div>
      }

      <!-- Footer -->
      <div
        class="flex items-center justify-between pt-3 border-t border-border-default"
      >
        <!-- Assignee -->
        <div class="flex items-center">
          @if (task.assignees && task.assignees.length > 0) { @if
          (task.assignees.length === 1) {
          <app-avatar
            [src]="task.assignees[0].avatarUrl || ''"
            [name]="task.assignees[0].fullName"
            size="sm"
            class="mr-2"
          />
          <span class="text-sm text-text-muted">{{
            task.assignees[0].fullName
          }}</span>
          } @else {
          <div class="flex -space-x-2 mr-2">
            @for (assignee of task.assignees.slice(0, 3); track assignee.id) {
            <app-avatar
              [src]="assignee?.avatarUrl || ''"
              [name]="assignee.fullName"
              size="sm"
              class="border-2 border-surface"
            />
            } @if (task.assignees.length > 3) {
            <div
              class="w-6 h-6 bg-surface-muted border-2 border-surface rounded-full flex items-center justify-center"
            >
              <span class="text-xs text-text-muted"
                >+{{ task.assignees.length - 3 }}</span
              >
            </div>
            }
          </div>
          <span class="text-sm text-text-muted"
            >{{ task.assignees.length }} assigned</span
          >
          } } @else {
          <div class="flex items-center text-text-muted">
            <lucide-icon [img]="User" [size]="14" class="mr-1"></lucide-icon>
            <span class="text-sm">Unassigned</span>
          </div>
          }
        </div>

        <!-- Comments Count -->
        @if (task.commentCount > 0) {
        <div class="flex items-center text-text-muted">
          <lucide-icon
            [img]="MessageSquare"
            [size]="14"
            class="mr-1"
          ></lucide-icon>
          <span class="text-sm">{{ task.commentCount }}</span>
        </div>
        }
      </div>

      <!-- Status Indicator (for completed tasks) -->
      @if (task.status === 'COMPLETED') {
      <div class="absolute top-2 right-2">
        <lucide-icon
          [img]="CheckCircle"
          [size]="16"
          class="text-success-500"
        ></lucide-icon>
      </div>
      }

      <!-- Overdue Warning -->
      @if (task.isOverdue && task.status !== 'COMPLETED') {
      <div class="absolute top-2 left-2">
        <lucide-icon
          [img]="AlertTriangle"
          [size]="16"
          class="text-danger-500"
        ></lucide-icon>
      </div>
      }
    </div>
  `,
  styles: [
    `
      // @utility task-card {
      //   @apply relative bg-surface border border-border-default rounded-lg p-4 shadow-sm hover:shadow-md hover:border-border-hover transition-all duration-200 cursor-pointer;
      // }

      // @utility task-card-overdue {
      //   @apply border-l-4 border-l-danger-500;
      // }

      // @utility task-card-high-priority {
      //   @apply border-l-4;
      // }

      // @utility task-card-high-priority[class*='URGENT'] {
      //   @apply border-l-red-500;
      // }

      // @utility task-card-high-priority[class*='HIGH'] {
      //   @apply border-l-orange-500;
      // }

      // .task-card-menu-btn {
      //   @apply opacity-0 text-text-muted hover:text-text-default hover:bg-surface-muted rounded p-1 transition-all;
      // }

      // .task-card:hover .task-card-menu-btn {
      //   @apply opacity-100;
      // }

      // .line-clamp-2 {
      //   display: -webkit-box;
      //   -webkit-line-clamp: 2;
      //   -webkit-box-orient: vertical;
      //   overflow: hidden;
      // }
    `,
  ],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() statusChange = new EventEmitter<{
    taskId: string;
    newStatus: TaskStatus;
  }>();

  // Icons
  readonly Calendar = Calendar;
  readonly User = User;
  readonly MessageSquare = MessageSquare;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly MoreVertical = MoreVertical;

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < -1 && diffDays >= -7) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  onMenuClick(event: Event) {
    event.stopPropagation();
    // TODO: Implement context menu
    console.log('Task menu clicked for:', this.task.id);
  }
}
