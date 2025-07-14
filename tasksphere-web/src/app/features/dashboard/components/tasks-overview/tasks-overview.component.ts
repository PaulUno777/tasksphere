import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  CheckSquare,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  Calendar,
  User,
  Flag,
  ExternalLink,
} from 'lucide-angular';
import { Task } from '@core/models';
import { TranslationService } from '@core/services';

/**
 * TasksOverviewComponent displays user's important tasks
 * Shows tasks due today, overdue tasks, and upcoming deadlines
 */
@Component({
  selector: 'app-tasks-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Tasks Due Today -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h3 class="text-lg font-semibold text-text-default flex items-center">
            <lucide-icon
              [img]="Clock"
              [size]="20"
              class="mr-2 text-warning-600"
            ></lucide-icon>
            {{ i18n.translate('dashboard.tasksDueToday') || 'Due Today' }}
            <span class="ml-2 badge badge-sm badge-warning">{{
              tasksDueToday.length
            }}</span>
          </h3>

          <a
            routerLink="/tasks"
            [queryParams]="{ filter: 'due-today' }"
            class="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            {{ i18n.translate('dashboard.viewAll') || 'View All' }}
            <lucide-icon
              [img]="ExternalLink"
              [size]="14"
              class="ml-1"
            ></lucide-icon>
          </a>
        </div>

        <div class="card-body">
          @if (isLoading) {
          <!-- Loading skeleton -->
          @for (i of [1,2,3]; track i) {
          <div class="flex items-center space-x-3 p-3 mb-2">
            <div class="skeleton w-4 h-4 rounded"></div>
            <div class="flex-1">
              <div class="skeleton h-4 w-3/4 mb-1"></div>
              <div class="skeleton h-3 w-1/2"></div>
            </div>
          </div>
          } } @else if (tasksDueToday.length === 0) {
          <!-- Empty state -->
          <div class="text-center py-8">
            <lucide-icon
              [img]="CheckSquare"
              [size]="48"
              class="mx-auto text-success-400 mb-3"
            ></lucide-icon>
            <p class="text-text-muted">
              {{
                i18n.translate('dashboard.noTasksDueToday') ||
                  'No tasks due today'
              }}
            </p>
          </div>
          } @else {
          <!-- Task list -->
          @for (task of tasksDueToday.slice(0, 5); track task.id) {
          <div
            class="flex items-center space-x-3 p-3 hover:bg-surface-muted rounded-lg transition-colors duration-200"
          >
            <!-- Checkbox -->
            <button
              type="button"
              (click)="onTaskToggle(task)"
              class="w-4 h-4 border-2 border-border-default rounded hover:border-primary-500 transition-colors duration-200 flex items-center justify-center"
              [class.bg-primary-500]="task.status === 'COMPLETED'"
              [class.border-primary-500]="task.status === 'COMPLETED'"
            >
              @if (task.status === 'COMPLETED') {
              <lucide-icon
                [img]="CheckSquare"
                [size]="12"
                class="text-white"
              ></lucide-icon>
              }
            </button>

            <!-- Task info -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium text-text-default truncate"
                [class.line-through]="task.status === 'COMPLETED'"
                [class.text-text-muted]="task.status === 'COMPLETED'"
              >
                {{ task.title }}
              </p>
              <div class="flex items-center space-x-3 mt-1">
                <!-- Board -->
                <span class="text-xs text-text-muted">
                  {{ task.board.title }}
                </span>
                <!-- Priority -->
                @if (task.priority && task.priority !== 'LOW') {
                <span
                  class="badge badge-xs"
                  [class.badge-danger]="task.priority === 'CRITICAL'"
                  [class.badge-warning]="task.priority === 'HIGH'"
                  [class.badge-primary]="task.priority === 'MEDIUM'"
                >
                  {{
                    i18n.translate('priority.' + task.priority.toLowerCase()) ||
                      task.priority
                  }}
                </span>
                }
                <!-- Assignee -->
                @if (task.assignedTo) {
                <div class="flex items-center text-xs text-text-muted">
                  <lucide-icon
                    [img]="User"
                    [size]="10"
                    class="mr-1"
                  ></lucide-icon>
                  {{ task.assignedTo.firstName }}
                </div>
                }
              </div>
            </div>

            <!-- Due time -->
            @if (task.dueDate) {
            <div class="text-xs text-text-muted">
              {{ formatDueTime(task.dueDate) }}
            </div>
            }
          </div>
          }

          <!-- Show more link -->
          @if (tasksDueToday.length > 5) {
          <div class="text-center pt-3 border-t border-border-default">
            <a
              routerLink="/tasks"
              [queryParams]="{ filter: 'due-today' }"
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              {{
                i18n.translate('dashboard.showMoreTasks', {
                  count: tasksDueToday.length - 5
                }) || 'Show ' + (tasksDueToday.length - 5) + ' more tasks'
              }}
            </a>
          </div>
          } }
        </div>
      </div>

      <!-- Overdue Tasks -->
      @if (overdueTasks.length > 0) {
      <div class="card border-l-4 border-l-danger-500">
        <div class="card-header flex items-center justify-between">
          <h3 class="text-lg font-semibold text-text-default flex items-center">
            <lucide-icon
              [img]="AlertTriangle"
              [size]="20"
              class="mr-2 text-danger-600"
            ></lucide-icon>
            {{ i18n.translate('dashboard.overdueTasks') || 'Overdue' }}
            <span class="ml-2 badge badge-sm badge-danger">{{
              overdueTasks.length
            }}</span>
          </h3>

          <a
            routerLink="/tasks"
            [queryParams]="{ filter: 'overdue' }"
            class="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            {{ i18n.translate('dashboard.viewAll') || 'View All' }}
            <lucide-icon
              [img]="ExternalLink"
              [size]="14"
              class="ml-1"
            ></lucide-icon>
          </a>
        </div>

        <div class="card-body">
          @for (task of overdueTasks.slice(0, 3); track task.id) {
          <div
            class="flex items-center space-x-3 p-3 hover:bg-danger-50 dark:hover:bg-danger-900 rounded-lg transition-colors duration-200"
          >
            <!-- Checkbox -->
            <button
              type="button"
              (click)="onTaskToggle(task)"
              class="w-4 h-4 border-2 border-danger-500 rounded hover:bg-danger-500 transition-colors duration-200 flex items-center justify-center"
              [class.bg-danger-500]="task.status === 'COMPLETED'"
            >
              @if (task.status === 'COMPLETED') {
              <lucide-icon
                [img]="CheckSquare"
                [size]="12"
                class="text-white"
              ></lucide-icon>
              }
            </button>

            <!-- Task info -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium text-text-default truncate"
                [class.line-through]="task.status === 'COMPLETED'"
                [class.text-text-muted]="task.status === 'COMPLETED'"
              >
                {{ task.title }}
              </p>
              <div class="flex items-center space-x-3 mt-1">
                <span class="text-xs text-text-muted">{{
                  task.board.title
                }}</span>
                <span class="text-xs text-danger-600">
                  {{ getOverdueDays(task.dueDate!) }}
                  {{
                    i18n.translate('dashboard.daysOverdue') || 'days overdue'
                  }}
                </span>
              </div>
            </div>
          </div>
          }
        </div>
      </div>
      }

      <!-- Quick Add Task -->
      <div
        class="card border-2 border-dashed border-border-default hover:border-primary-300 transition-colors duration-200"
      >
        <a
          routerLink="/tasks/new"
          class="card-body flex items-center justify-center py-8 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors duration-200"
        >
          <div class="text-center">
            <div
              class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <lucide-icon
                [img]="Plus"
                [size]="24"
                class="text-primary-600 dark:text-primary-400"
              ></lucide-icon>
            </div>
            <p class="text-sm font-medium text-text-default">
              {{
                i18n.translate('dashboard.createNewTask') || 'Create New Task'
              }}
            </p>
            <p class="text-xs text-text-muted mt-1">
              {{
                i18n.translate('dashboard.quickTaskCreation') ||
                  'Add a task to get started'
              }}
            </p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class TasksOverviewComponent {
  // Lucide icons
  readonly CheckSquare = CheckSquare;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Plus = Plus;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly Flag = Flag;
  readonly ExternalLink = ExternalLink;

  readonly i18n = inject(TranslationService);

  @Input() tasksDueToday: Task[] = [];
  @Input() overdueTasks: Task[] = [];
  @Input() urgentTasks: Task[] = [];
  @Input() showCompleted = false;
  @Input() isLoading = false;

  @Output() toggleCompleted = new EventEmitter<void>();
  @Output() taskComplete = new EventEmitter<{
    taskId: string;
    completed: boolean;
  }>();

  /**
   * Handles task completion toggle
   */
  onTaskToggle(task: Task): void {
    const completed = task.status !== 'COMPLETED';
    this.taskComplete.emit({ taskId: task.id, completed });
  }

  /**
   * Formats due time for display
   */
  formatDueTime(dueDate: string): string {
    const date = new Date(dueDate);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Calculates days overdue
   */
  getOverdueDays(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
