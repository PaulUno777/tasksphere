import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  LucideAngularModule,
  Plus,
  MoreVertical,
  Calendar,
  User,
  AlertTriangle,
  Clock,
} from 'lucide-angular';
import { Task, KanbanBoard } from '@core/models/task.model';
import { TaskStatus, TaskPriority } from '@core/types';
import { TaskCardComponent } from '../task-card/task-card';

@Component({
  selector: 'app-task-kanban',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    LucideAngularModule,
    TaskCardComponent,
  ],
  template: `
    <div class="flex gap-6 overflow-x-auto pb-4">
      <!-- TODO Column -->
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <h3 class="font-semibold text-text-default">To Do</h3>
            <span
              class="ml-2 text-sm text-text-muted bg-surface-muted px-2 py-1 rounded-full"
            >
              {{ kanbanData.todo.length }}
            </span>
          </div>
          <button
            class="text-text-muted hover:text-text-default transition-colors"
          >
            <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
          </button>
        </div>

        <div
          class="kanban-column-content"
          cdkDropList
          [cdkDropListData]="kanbanData.todo"
          [cdkDropListConnectedTo]="connectedLists"
          (cdkDropListDropped)="onTaskDrop($event)"
          id="todo-list"
        >
          @for (task of kanbanData.todo; track task.id) {
          <div cdkDrag [cdkDragData]="task" class="task-drag-item">
            <app-task-card
              [task]="task"
              (click)="onTaskClick(task)"
              (statusChange)="onTaskStatusChange($event)"
            />
          </div>
          } @if (kanbanData.todo.length === 0) {
          <div class="empty-column">
            <lucide-icon
              [img]="Plus"
              [size]="24"
              class="text-text-muted mb-2"
            ></lucide-icon>
            <p class="text-sm text-text-muted text-center">No tasks yet</p>
          </div>
          }
        </div>
      </div>

      <!-- IN_PROGRESS Column -->
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <h3 class="font-semibold text-text-default">In Progress</h3>
            <span
              class="ml-2 text-sm text-text-muted bg-surface-muted px-2 py-1 rounded-full"
            >
              {{ kanbanData.inProgress.length }}
            </span>
          </div>
          <button
            class="text-text-muted hover:text-text-default transition-colors"
          >
            <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
          </button>
        </div>

        <div
          class="kanban-column-content"
          cdkDropList
          [cdkDropListData]="kanbanData.inProgress"
          [cdkDropListConnectedTo]="connectedLists"
          (cdkDropListDropped)="onTaskDrop($event)"
          id="in-progress-list"
        >
          @for (task of kanbanData.inProgress; track task.id) {
          <div cdkDrag [cdkDragData]="task" class="task-drag-item">
            <app-task-card
              [task]="task"
              (click)="onTaskClick(task)"
              (statusChange)="onTaskStatusChange($event)"
            />
          </div>
          } @if (kanbanData.inProgress.length === 0) {
          <div class="empty-column">
            <lucide-icon
              [img]="Clock"
              [size]="24"
              class="text-text-muted mb-2"
            ></lucide-icon>
            <p class="text-sm text-text-muted text-center">
              No tasks in progress
            </p>
          </div>
          }
        </div>
      </div>

      <!-- REVIEW Column -->
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <h3 class="font-semibold text-text-default">Review</h3>
            <span
              class="ml-2 text-sm text-text-muted bg-surface-muted px-2 py-1 rounded-full"
            >
              {{ kanbanData.review.length }}
            </span>
          </div>
          <button
            class="text-text-muted hover:text-text-default transition-colors"
          >
            <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
          </button>
        </div>

        <div
          class="kanban-column-content"
          cdkDropList
          [cdkDropListData]="kanbanData.review"
          [cdkDropListConnectedTo]="connectedLists"
          (cdkDropListDropped)="onTaskDrop($event)"
          id="review-list"
        >
          @for (task of kanbanData.review; track task.id) {
          <div cdkDrag [cdkDragData]="task" class="task-drag-item">
            <app-task-card
              [task]="task"
              (click)="onTaskClick(task)"
              (statusChange)="onTaskStatusChange($event)"
            />
          </div>
          } @if (kanbanData.review.length === 0) {
          <div class="empty-column">
            <lucide-icon
              [img]="AlertTriangle"
              [size]="24"
              class="text-text-muted mb-2"
            ></lucide-icon>
            <p class="text-sm text-text-muted text-center">
              No tasks under review
            </p>
          </div>
          }
        </div>
      </div>

      <!-- COMPLETED Column -->
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <h3 class="font-semibold text-text-default">Completed</h3>
            <span
              class="ml-2 text-sm text-text-muted bg-surface-muted px-2 py-1 rounded-full"
            >
              {{ kanbanData.completed.length }}
            </span>
          </div>
          <button
            class="text-text-muted hover:text-text-default transition-colors"
          >
            <lucide-icon [img]="MoreVertical" [size]="16"></lucide-icon>
          </button>
        </div>

        <div
          class="kanban-column-content"
          cdkDropList
          [cdkDropListData]="kanbanData.completed"
          [cdkDropListConnectedTo]="connectedLists"
          (cdkDropListDropped)="onTaskDrop($event)"
          id="completed-list"
        >
          @for (task of kanbanData.completed; track task.id) {
          <div cdkDrag [cdkDragData]="task" class="task-drag-item">
            <app-task-card
              [task]="task"
              (click)="onTaskClick(task)"
              (statusChange)="onTaskStatusChange($event)"
            />
          </div>
          } @if (kanbanData.completed.length === 0) {
          <div class="empty-column">
            <lucide-icon
              [img]="Calendar"
              [size]="24"
              class="text-text-muted mb-2"
            ></lucide-icon>
            <p class="text-sm text-text-muted text-center">
              No completed tasks
            </p>
          </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .kanban-column {
        @apply min-w-80 bg-surface rounded-lg border border-border-default;
      }

      .kanban-column-header {
        @apply flex items-center justify-between p-4 border-b border-border-default;
      }

      .kanban-column-content {
        @apply p-4 space-y-3 min-h-96 max-h-[calc(100vh-300px)] overflow-y-auto;
      }

      .task-drag-item {
        @apply cursor-pointer transition-transform;
      }

      .task-drag-item:hover {
        @apply transform scale-[1.02];
      }

      .cdk-drag-preview {
        @apply shadow-lg rotate-3 opacity-90;
      }

      .cdk-drag-placeholder {
        @apply opacity-50 bg-surface-muted border-2 border-dashed border-border-default rounded-lg;
      }

      .cdk-drop-list-dragging .cdk-drag {
        @apply transition-transform;
      }

      .empty-column {
        @apply flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border-default rounded-lg;
      }

      .cdk-drop-list-receiving {
        @apply bg-primary-50 border-primary-200;
      }

      .cdk-drag-animating {
        @apply transition-transform duration-250;
      }
    `,
  ],
})
export class TaskKanbanComponent {
  @Input({ required: true }) kanbanData!: KanbanBoard;
  @Output() taskStatusChange = new EventEmitter<{
    taskId: string;
    newStatus: TaskStatus;
    newPosition: number;
  }>();
  @Output() taskClick = new EventEmitter<Task>();

  // Icons
  readonly Plus = Plus;
  readonly MoreVertical = MoreVertical;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;

  // Connected lists for drag and drop
  connectedLists = [
    'todo-list',
    'in-progress-list',
    'review-list',
    'completed-list',
  ];

  onTaskDrop(event: CdkDragDrop<Task[]>) {
    const task = event.item.data as Task;

    if (event.previousContainer === event.container) {
      // Same column - just reorder
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Different column - move task and update status
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Determine new status based on the target container
      let newStatus: TaskStatus;
      switch (event.container.id) {
        case 'todo-list':
          newStatus = 'TODO';
          break;
        case 'in-progress-list':
          newStatus = 'IN_PROGRESS';
          break;
        case 'review-list':
          newStatus = 'REVIEW';
          break;
        case 'completed-list':
          newStatus = 'COMPLETED';
          break;
        default:
          newStatus = 'TODO';
      }

      // Emit the status change
      this.taskStatusChange.emit({
        taskId: task.id,
        newStatus,
        newPosition: event.currentIndex,
      });
    }
  }

  onTaskClick(task: Task) {
    this.taskClick.emit(task);
  }

  onTaskStatusChange(event: { taskId: string; newStatus: TaskStatus }) {
    // Find the task and move it to the appropriate column
    const task = this.findTaskById(event.taskId);
    if (task) {
      this.moveTaskToStatus(task, event.newStatus);
      this.taskStatusChange.emit({
        taskId: event.taskId,
        newStatus: event.newStatus,
        newPosition: 0, // Add to beginning of new column
      });
    }
  }

  private findTaskById(taskId: string): Task | null {
    for (const column of Object.values(this.kanbanData)) {
      const task = column.find((t: Task) => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  private moveTaskToStatus(task: Task, newStatus: TaskStatus) {
    // Remove from current column
    for (const column of Object.values(this.kanbanData)) {
      const index = column.findIndex((t: Task) => t.id === task.id);
      if (index !== -1) {
        column.splice(index, 1);
        break;
      }
    }

    // Add to new column
    const updatedTask = { ...task, status: newStatus };
    switch (newStatus) {
      case 'TODO':
        this.kanbanData.todo.unshift(updatedTask);
        break;
      case 'IN_PROGRESS':
        this.kanbanData.inProgress.unshift(updatedTask);
        break;
      case 'REVIEW':
        this.kanbanData.review.unshift(updatedTask);
        break;
      case 'COMPLETED':
        this.kanbanData.completed.unshift(updatedTask);
        break;
    }
  }
}
