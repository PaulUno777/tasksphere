import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, Plus, LayoutGrid, List, Calendar, User, CheckSquare, Clock, AlertTriangle } from 'lucide-angular';
import { TaskService } from '@core/services/task.service';
import { Task, KanbanBoard } from '@core/models/task.model';
import { TaskStatus, TaskPriority } from '@core/types';
import { TaskKanbanComponent } from '../../components/task-kanban/task-kanban';
import { TaskFiltersComponent } from '../../components/task-filters/task-filters';
import { TaskDetailModalComponent } from '../../components/task-detail-modal/task-detail-modal';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToMe?: boolean;
  search?: string;
  dueToday?: boolean;
  overdue?: boolean;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    TaskKanbanComponent,
    TaskFiltersComponent,
    TaskDetailModalComponent,
  ],
  template: `
    <div class="min-h-screen bg-background">
      <div class="container-responsive py-4 space-y-6 mx-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-text-default">My Tasks</h1>
            <p class="text-text-muted mt-1">
              Manage and track your assigned tasks
            </p>
          </div>
          
          <!-- Quick Actions -->
          <div class="flex items-center gap-3">
            <!-- View Toggle -->
            <div class="flex items-center bg-surface-muted rounded-lg p-1">
              <button
                (click)="setViewMode('kanban')"
                [class.bg-surface]="viewMode() === 'kanban'"
                [class.text-primary-600]="viewMode() === 'kanban'"
                class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <lucide-icon [img]="LayoutGrid" [size]="16" class="mr-2"></lucide-icon>
                Kanban
              </button>
              <button
                (click)="setViewMode('list')"
                [class.bg-surface]="viewMode() === 'list'"
                [class.text-primary-600]="viewMode() === 'list'"
                class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <lucide-icon [img]="List" [size]="16" class="mr-2"></lucide-icon>
                List
              </button>
            </div>

            <!-- Create Task Button -->
            <button
              (click)="openCreateTaskModal()"
              class="btn-primary btn-md"
            >
              <lucide-icon [img]="Plus" [size]="16" class="mr-2"></lucide-icon>
              New Task
            </button>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="card p-4">
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <!-- Search -->
            <div class="relative flex-1 max-w-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <lucide-icon [img]="Search" [size]="18" class="text-text-muted"></lucide-icon>
              </div>
              <input
                type="search"
                placeholder="Search tasks..."
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
                class="w-full pl-10 pr-4 py-2 border border-border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <!-- Quick Filters -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="toggleFilter('assignedToMe')"
                [class.btn-primary]="filters().assignedToMe"
                [class.btn-secondary]="!filters().assignedToMe"
                class="btn-sm"
              >
                <lucide-icon [img]="User" [size]="14" class="mr-1"></lucide-icon>
                My Tasks
              </button>
              
              <button
                (click)="toggleFilter('dueToday')"
                [class.btn-primary]="filters().dueToday"
                [class.btn-secondary]="!filters().dueToday"
                class="btn-sm"
              >
                <lucide-icon [img]="Calendar" [size]="14" class="mr-1"></lucide-icon>
                Due Today
              </button>
              
              <button
                (click)="toggleFilter('overdue')"
                [class.btn-danger]="filters().overdue"
                [class.btn-secondary]="!filters().overdue"
                class="btn-sm"
              >
                <lucide-icon [img]="AlertTriangle" [size]="14" class="mr-1"></lucide-icon>
                Overdue
              </button>

              <!-- Filters Toggle -->
              <button
                (click)="toggleFiltersPanel()"
                [class.btn-primary]="showFilters()"
                [class.btn-secondary]="!showFilters()"
                class="btn-sm"
              >
                <lucide-icon [img]="Filter" [size]="14" class="mr-1"></lucide-icon>
                Filters
              </button>
            </div>
          </div>

          <!-- Advanced Filters Panel -->
          @if (showFilters()) {
          <div class="border-t border-border-default mt-4 pt-4">
            <app-task-filters
              [filters]="filters()"
              (filtersChange)="onFiltersChange($event)"
            />
          </div>
          }
        </div>

        <!-- Tasks Summary -->
        @if (kanbanData(); as data) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-text-muted">To Do</p>
                <p class="text-2xl font-semibold text-text-default">{{ data.todo.length }}</p>
              </div>
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="CheckSquare" [size]="20" class="text-gray-600"></lucide-icon>
              </div>
            </div>
          </div>
          
          <div class="card p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-text-muted">In Progress</p>
                <p class="text-2xl font-semibold text-text-default">{{ data.inProgress.length }}</p>
              </div>
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="Clock" [size]="20" class="text-blue-600"></lucide-icon>
              </div>
            </div>
          </div>
          
          <div class="card p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-text-muted">Review</p>
                <p class="text-2xl font-semibold text-text-default">{{ data.review.length }}</p>
              </div>
              <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="AlertTriangle" [size]="20" class="text-yellow-600"></lucide-icon>
              </div>
            </div>
          </div>
          
          <div class="card p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-text-muted">Completed</p>
                <p class="text-2xl font-semibold text-text-default">{{ data.completed.length }}</p>
              </div>
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="CheckSquare" [size]="20" class="text-green-600"></lucide-icon>
              </div>
            </div>
          </div>
        </div>
        }

        <!-- Main Content -->
        @if (isLoading()) {
        <div class="card p-8 text-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-text-muted">Loading tasks...</p>
        </div>
        } @else if (error()) {
        <div class="card p-8 text-center">
          <div class="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon [img]="AlertTriangle" [size]="32" class="text-danger-600"></lucide-icon>
          </div>
          <h3 class="text-lg font-semibold text-text-default mb-2">Failed to load tasks</h3>
          <p class="text-text-muted mb-4">{{ error() }}</p>
          <button (click)="loadTasks()" class="btn-primary btn-md">Try Again</button>
        </div>
        } @else {
          <!-- Kanban View -->
          @if (viewMode() === 'kanban' && kanbanData()) {
          <app-task-kanban
            [kanbanData]="kanbanData()!"
            (taskStatusChange)="onTaskStatusChange($event)"
            (taskClick)="onTaskClick($event)"
          />
          }

          <!-- List View (TODO: Implement) -->
          @if (viewMode() === 'list') {
          <div class="card p-8 text-center">
            <p class="text-text-muted">List view coming soon...</p>
          </div>
          }
        }

        <!-- Task Detail Modal -->
        @if (selectedTask()) {
        <app-task-detail-modal
          [task]="selectedTask()!"
          [isOpen]="showTaskModal()"
          (close)="closeTaskModal()"
          (taskUpdate)="onTaskUpdate($event)"
        />
        }
      </div>
    </div>
  `,
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);

  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Plus = Plus;
  readonly LayoutGrid = LayoutGrid;
  readonly List = List;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly CheckSquare = CheckSquare;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;

  // State
  viewMode = signal<'kanban' | 'list'>('kanban');
  isLoading = signal(false);
  error = signal<string | null>(null);
  showFilters = signal(false);
  showTaskModal = signal(false);
  selectedTask = signal<Task | null>(null);
  searchQuery = '';

  // Filters
  filters = signal<TaskFilters>({
    assignedToMe: true,
  });

  // Data
  kanbanData = toSignal(
    this.taskService.getMyTasksKanban().pipe(
      map(response => response.data)
    )
  );

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading.set(true);
    this.error.set(null);
    
    // Task loading is handled by the toSignal above
    // We could add additional loading logic here if needed
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  setViewMode(mode: 'kanban' | 'list') {
    this.viewMode.set(mode);
  }

  toggleFiltersPanel() {
    this.showFilters.set(!this.showFilters());
  }

  toggleFilter(filterKey: keyof TaskFilters) {
    const currentFilters = this.filters();
    this.filters.set({
      ...currentFilters,
      [filterKey]: !currentFilters[filterKey],
    });
    this.applyFilters();
  }

  onSearchChange() {
    const currentFilters = this.filters();
    this.filters.set({
      ...currentFilters,
      search: this.searchQuery || undefined,
    });
    this.applyFilters();
  }

  onFiltersChange(newFilters: TaskFilters) {
    this.filters.set(newFilters);
    this.applyFilters();
  }

  private applyFilters() {
    // TODO: Implement actual filtering logic with API
    console.log('Applying filters:', this.filters());
  }

  onTaskStatusChange(event: { taskId: string; newStatus: TaskStatus; newPosition: number }) {
    this.taskService.updateTaskStatus(event.taskId, { status: event.newStatus }).then(() => {
      // Task will be updated via the reactive signal
      this.loadTasks();
    }).catch((error) => {
      console.error('Failed to update task status:', error);
      // TODO: Show error message
    });
  }

  onTaskClick(task: Task) {
    this.selectedTask.set(task);
    this.showTaskModal.set(true);
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
    this.selectedTask.set(null);
  }

  onTaskUpdate(updatedTask: Task) {
    // TODO: Update the task in the kanban data
    this.loadTasks();
  }

  openCreateTaskModal() {
    // TODO: Implement create task modal
    console.log('Create task modal');
  }
}