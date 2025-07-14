import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Calendar, User, Flag } from 'lucide-angular';
import { TaskPriority, TaskStatus } from '@core/types';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToMe?: boolean;
  search?: string;
  dueToday?: boolean;
  overdue?: boolean;
}

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-text-default mb-2">
            Status
          </label>
          <select
            [(ngModel)]="localFilters.status"
            (ngModelChange)="onFilterChange()"
            class="w-full px-3 py-2 border border-border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option [ngValue]="undefined">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <!-- Priority Filter -->
        <div>
          <label class="block text-sm font-medium text-text-default mb-2">
            Priority
          </label>
          <select
            [(ngModel)]="localFilters.priority"
            (ngModelChange)="onFilterChange()"
            class="w-full px-3 py-2 border border-border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option [ngValue]="undefined">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <!-- Due Date Filter -->
        <div>
          <label class="block text-sm font-medium text-text-default mb-2">
            Due Date
          </label>
          <select
            [(ngModel)]="dueDateFilter"
            (ngModelChange)="onDueDateFilterChange($event)"
            class="w-full px-3 py-2 border border-border-default rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Tasks</option>
            <option value="today">Due Today</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming (7 days)</option>
            <option value="no-due-date">No Due Date</option>
          </select>
        </div>
      </div>

      <!-- Toggle Filters -->
      <div class="flex flex-wrap gap-3">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            [(ngModel)]="localFilters.assignedToMe"
            (ngModelChange)="onFilterChange()"
            class="rounded border-border-default text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm text-text-default">Assigned to me only</span>
        </label>
      </div>

      <!-- Active Filters -->
      @if (hasActiveFilters()) {
      <div class="border-t border-border-default pt-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-text-default">Active Filters</span>
          <button
            (click)="clearAllFilters()"
            class="text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <div class="flex flex-wrap gap-2">
          @if (localFilters.status) {
          <div class="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
            Status: {{ getStatusLabel(localFilters.status) }}
            <button
              (click)="removeFilter('status')"
              class="ml-2 text-primary-600 hover:text-primary-800"
            >
              <lucide-icon [img]="X" [size]="12"></lucide-icon>
            </button>
          </div>
          }
          
          @if (localFilters.priority) {
          <div class="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
            <lucide-icon [img]="Flag" [size]="12" class="mr-1"></lucide-icon>
            {{ localFilters.priority }}
            <button
              (click)="removeFilter('priority')"
              class="ml-2 text-primary-600 hover:text-primary-800"
            >
              <lucide-icon [img]="X" [size]="12"></lucide-icon>
            </button>
          </div>
          }
          
          @if (localFilters.assignedToMe) {
          <div class="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
            <lucide-icon [img]="User" [size]="12" class="mr-1"></lucide-icon>
            My Tasks
            <button
              (click)="removeFilter('assignedToMe')"
              class="ml-2 text-primary-600 hover:text-primary-800"
            >
              <lucide-icon [img]="X" [size]="12"></lucide-icon>
            </button>
          </div>
          }
          
          @if (localFilters.dueToday) {
          <div class="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
            <lucide-icon [img]="Calendar" [size]="12" class="mr-1"></lucide-icon>
            Due Today
            <button
              (click)="removeFilter('dueToday')"
              class="ml-2 text-primary-600 hover:text-primary-800"
            >
              <lucide-icon [img]="X" [size]="12"></lucide-icon>
            </button>
          </div>
          }
          
          @if (localFilters.overdue) {
          <div class="inline-flex items-center px-3 py-1 bg-danger-100 text-danger-800 rounded-full text-sm">
            <lucide-icon [img]="Calendar" [size]="12" class="mr-1"></lucide-icon>
            Overdue
            <button
              (click)="removeFilter('overdue')"
              class="ml-2 text-danger-600 hover:text-danger-800"
            >
              <lucide-icon [img]="X" [size]="12"></lucide-icon>
            </button>
          </div>
          }
        </div>
      </div>
      }
    </div>
  `,
})
export class TaskFiltersComponent {
  @Input({ required: true }) filters!: TaskFilters;
  @Output() filtersChange = new EventEmitter<TaskFilters>();

  // Icons
  readonly X = X;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly Flag = Flag;

  // Local state
  localFilters: TaskFilters = {};
  dueDateFilter = '';

  ngOnInit() {
    this.localFilters = { ...this.filters };
    this.updateDueDateFilter();
  }

  ngOnChanges() {
    this.localFilters = { ...this.filters };
    this.updateDueDateFilter();
  }

  private updateDueDateFilter() {
    if (this.localFilters.dueToday) {
      this.dueDateFilter = 'today';
    } else if (this.localFilters.overdue) {
      this.dueDateFilter = 'overdue';
    } else {
      this.dueDateFilter = '';
    }
  }

  onFilterChange() {
    this.filtersChange.emit({ ...this.localFilters });
  }

  onDueDateFilterChange(value: string) {
    this.localFilters = {
      ...this.localFilters,
      dueToday: value === 'today',
      overdue: value === 'overdue',
    };
    this.onFilterChange();
  }

  removeFilter(filterKey: keyof TaskFilters) {
    this.localFilters = {
      ...this.localFilters,
      [filterKey]: undefined,
    };
    
    // Special handling for due date filters
    if (filterKey === 'dueToday' || filterKey === 'overdue') {
      this.dueDateFilter = '';
    }
    
    this.onFilterChange();
  }

  clearAllFilters() {
    this.localFilters = {};
    this.dueDateFilter = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.localFilters).some(value => 
      value !== undefined && value !== false && value !== ''
    );
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'TODO': return 'To Do';
      case 'IN_PROGRESS': return 'In Progress';
      case 'REVIEW': return 'Review';
      case 'COMPLETED': return 'Completed';
      case 'ARCHIVED': return 'Archived';
      default: return status;
    }
  }
}