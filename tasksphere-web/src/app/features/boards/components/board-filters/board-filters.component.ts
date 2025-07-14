import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Filter,
  Calendar,
  Users,
  Star,
  Archive,
  Trash2,
  CheckCircle,
  Crown,
  Shield,
  User,
  Eye,
} from 'lucide-angular';

import { BoardQuery, BoardRole, BoardStatus } from '@core/types';
import { TranslationService } from '@core/services';

interface StatusFilterOption {
  value: BoardStatus;
  label: string;
  icon?: any;
  count?: number;
}

interface RoleFilterOption {
  value: BoardRole;
  label: string;
  icon?: any;
  count?: number;
}

interface DateRangeFilterOption {
  value: string;
  label: string;
  icon?: any;
  count?: number;
}

@Component({
  selector: 'app-board-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="bg-surface border-b border-border-default">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <!-- Filter Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="Filter"
              [size]="16"
              class="text-text-muted"
            ></lucide-icon>
            <h3 class="text-sm font-medium text-text-default">
              {{ i18n.t('boards.filters.title') }}
            </h3>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Active Filters Count -->
            @if (activeFiltersCount() > 0) {
            <span class="text-xs text-text-muted">
              {{
                i18n.t('boards.filters.active', { count: activeFiltersCount() })
              }}
            </span>
            }

            <!-- Clear All Button -->
            @if (hasActiveFilters()) {
            <button
              (click)="clearAll()"
              class="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {{ i18n.t('common.clearAll') }}
            </button>
            }
          </div>
        </div>

        <!-- Filter Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Status Filter -->
          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-text-default uppercase tracking-wide"
            >
              {{ i18n.t('boards.filters.status') }}
            </label>
            <div class="space-y-1">
              @for (option of statusOptions(); track option.value) {
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  [value]="option.value"
                  [checked]="isStatusSelected(option.value)"
                  (change)="toggleStatus(option.value)"
                  class="rounded border-border-default text-primary-600 focus:ring-primary-500"
                />
                <div class="flex items-center space-x-2 text-sm">
                  <lucide-icon
                    [img]="option.icon"
                    [size]="14"
                    [class]="getStatusIconClass(option.value)"
                  ></lucide-icon>
                  <span class="text-text-default">{{ option.label }}</span>
                  @if (option.count !== undefined) {
                  <span class="text-xs text-text-muted"
                    >({{ option.count }})</span
                  >
                  }
                </div>
              </label>
              }
            </div>
          </div>

          <!-- Role Filter -->
          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-text-default uppercase tracking-wide"
            >
              {{ i18n.t('boards.filters.myRole') }}
            </label>
            <div class="space-y-1">
              @for (option of roleOptions(); track option.value) {
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  [value]="option.value"
                  [checked]="isRoleSelected(option.value)"
                  (change)="toggleRole(option.value)"
                  class="rounded border-border-default text-primary-600 focus:ring-primary-500"
                />
                <div class="flex items-center space-x-2 text-sm">
                  <lucide-icon
                    [img]="option.icon"
                    [size]="14"
                    [class]="getRoleIconClass(option.value)"
                  ></lucide-icon>
                  <span class="text-text-default">{{ option.label }}</span>
                  @if (option.count !== undefined) {
                  <span class="text-xs text-text-muted"
                    >({{ option.count }})</span
                  >
                  }
                </div>
              </label>
              }
            </div>
          </div>

          <!-- Date Range Filter -->
          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-text-default uppercase tracking-wide"
            >
              {{ i18n.t('boards.filters.lastUpdated') }}
            </label>
            <div class="space-y-1">
              @for (option of dateRangeOptions(); track option.value) {
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateRange"
                  [value]="option.value"
                  [checked]="selectedDateRange() === option.value"
                  (change)="selectDateRange(option.value)"
                  class="border-border-default text-primary-600 focus:ring-primary-500"
                />
                <div class="flex items-center space-x-2 text-sm">
                  <lucide-icon
                    [img]="Calendar"
                    [size]="14"
                    class="text-text-muted"
                  ></lucide-icon>
                  <span class="text-text-default">{{ option.label }}</span>
                </div>
              </label>
              }
            </div>
          </div>

          <!-- Quick Filters -->
          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-text-default uppercase tracking-wide"
            >
              {{ i18n.t('boards.filters.quickFilters') }}
            </label>
            <div class="space-y-1">
              <!-- Starred Boards -->
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="showStarredOnly()"
                  (change)="toggleStarredOnly()"
                  class="rounded border-border-default text-primary-600 focus:ring-primary-500"
                />
                <div class="flex items-center space-x-2 text-sm">
                  <lucide-icon
                    [img]="Star"
                    [size]="14"
                    class="text-warning-500"
                  ></lucide-icon>
                  <span class="text-text-default">{{
                    i18n.t('boards.filters.starred')
                  }}</span>
                </div>
              </label>

              <!-- Boards I Own -->
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="showOwnedOnly()"
                  (change)="toggleOwnedOnly()"
                  class="rounded border-border-default text-primary-600 focus:ring-primary-500"
                />
                <div class="flex items-center space-x-2 text-sm">
                  <lucide-icon
                    [img]="Crown"
                    [size]="14"
                    class="text-primary-500"
                  ></lucide-icon>
                  <span class="text-text-default">{{
                    i18n.t('boards.filters.owned')
                  }}</span>
                </div>
              </label>

              <!-- Recent Activity -->
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="showRecentActivity()"
                  (change)="toggleRecentActivity()"
                  class="rounded border-border-default text-primary-600 focus:ring-primary-500"
                />
                <div class="flex items-center space-x-2 text-sm">
                  <lucide-icon
                    [img]="Calendar"
                    [size]="14"
                    class="text-success-500"
                  ></lucide-icon>
                  <span class="text-text-default">{{
                    i18n.t('boards.filters.recentActivity')
                  }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Active Filter Tags -->
        @if (hasActiveFilters()) {
        <div class="mt-4 pt-4 border-t border-border-default">
          <div class="flex flex-wrap gap-2">
            <!-- Status Tags -->
            @for (status of selectedStatuses(); track status) {
            <div
              class="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
            >
              <span>{{ getStatusLabel(status) }}</span>
              <button
                (click)="removeStatus(status)"
                class="ml-1 hover:text-primary-900"
              >
                <lucide-icon [img]="X" [size]="12"></lucide-icon>
              </button>
            </div>
            }

            <!-- Role Tags -->
            @for (role of selectedRoles(); track role) {
            <div
              class="inline-flex items-center px-2 py-1 bg-success-50 text-success-700 text-xs rounded-full"
            >
              <span>{{ getRoleLabel(role) }}</span>
              <button
                (click)="removeRole(role)"
                class="ml-1 hover:text-success-900"
              >
                <lucide-icon [img]="X" [size]="12"></lucide-icon>
              </button>
            </div>
            }

            <!-- Date Range Tag -->
            @if (selectedDateRange() && selectedDateRange() !== 'all') {
            <div
              class="inline-flex items-center px-2 py-1 bg-warning-50 text-warning-700 text-xs rounded-full"
            >
              <span>{{ getDateRangeLabel(selectedDateRange()) }}</span>
              <button
                (click)="clearDateRange()"
                class="ml-1 hover:text-warning-900"
              >
                <lucide-icon [img]="X" [size]="12"></lucide-icon>
              </button>
            </div>
            }

            <!-- Quick Filter Tags -->
            @if (showStarredOnly()) {
            <div
              class="inline-flex items-center px-2 py-1 bg-warning-50 text-warning-700 text-xs rounded-full"
            >
              <lucide-icon [img]="Star" [size]="10" class="mr-1"></lucide-icon>
              <span>{{ i18n.t('boards.filters.starred') }}</span>
              <button
                (click)="toggleStarredOnly()"
                class="ml-1 hover:text-warning-900"
              >
                <lucide-icon [img]="X" [size]="12"></lucide-icon>
              </button>
            </div>
            } @if (showOwnedOnly()) {
            <div
              class="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
            >
              <lucide-icon [img]="Crown" [size]="10" class="mr-1"></lucide-icon>
              <span>{{ i18n.t('boards.filters.owned') }}</span>
              <button
                (click)="toggleOwnedOnly()"
                class="ml-1 hover:text-primary-900"
              >
                <lucide-icon [img]="X" [size]="12"></lucide-icon>
              </button>
            </div>
            } @if (showRecentActivity()) {
            <div
              class="inline-flex items-center px-2 py-1 bg-success-50 text-success-700 text-xs rounded-full"
            >
              <lucide-icon
                [img]="Calendar"
                [size]="10"
                class="mr-1"
              ></lucide-icon>
              <span>{{ i18n.t('boards.filters.recentActivity') }}</span>
              <button
                (click)="toggleRecentActivity()"
                class="ml-1 hover:text-success-900"
              >
                <lucide-icon [img]="X" [size]="12"></lucide-icon>
              </button>
            </div>
            }
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class BoardFiltersComponent {
  // Icons
  readonly X = X;
  readonly Filter = Filter;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Star = Star;
  readonly Archive = Archive;
  readonly Trash2 = Trash2;
  readonly CheckCircle = CheckCircle;
  readonly Crown = Crown;
  readonly Shield = Shield;
  readonly User = User;
  readonly Eye = Eye;

  // Services
  i18n = inject(TranslationService);

  // Inputs and Outputs
  @Input() filters: BoardQuery = {};
  @Output() filtersChange = new EventEmitter<BoardQuery>();
  @Output() clearFilters = new EventEmitter<void>();

  // Component State
  selectedStatuses = signal<BoardStatus[]>([]);
  selectedRoles = signal<BoardRole[]>([]);
  selectedDateRange = signal<string>('all');
  showStarredOnly = signal<boolean>(false);
  showOwnedOnly = signal<boolean>(false);
  showRecentActivity = signal<boolean>(false);

  // Computed Properties
  activeFiltersCount = computed(() => {
    return (
      this.selectedStatuses().length +
      this.selectedRoles().length +
      (this.selectedDateRange() !== 'all' ? 1 : 0) +
      (this.showStarredOnly() ? 1 : 0) +
      (this.showOwnedOnly() ? 1 : 0) +
      (this.showRecentActivity() ? 1 : 0)
    );
  });

  hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  // Filter Options
  statusOptions = computed<StatusFilterOption[]>(() => [
    {
      value: 'ACTIVE',
      label: this.i18n.t('boards.status.active'),
      icon: CheckCircle,
    },
    {
      value: 'ARCHIVED',
      label: this.i18n.t('boards.status.archived'),
      icon: Archive,
    },
  ]);

  roleOptions = computed<RoleFilterOption[]>(() => [
    {
      value: 'OWNER',
      label: this.i18n.t('boards.roles.owner'),
      icon: Crown,
    },
    {
      value: 'ADMIN',
      label: this.i18n.t('boards.roles.admin'),
      icon: Shield,
    },
    {
      value: 'MEMBER',
      label: this.i18n.t('boards.roles.member'),
      icon: User,
    },
    {
      value: 'GUEST',
      label: this.i18n.t('boards.roles.guest'),
      icon: Eye,
    },
  ]);

  dateRangeOptions = computed<DateRangeFilterOption[]>(() => [
    {
      value: 'all',
      label: this.i18n.t('boards.filters.allTime'),
    },
    {
      value: 'today',
      label: this.i18n.t('boards.filters.today'),
    },
    {
      value: 'week',
      label: this.i18n.t('boards.filters.thisWeek'),
    },
    {
      value: 'month',
      label: this.i18n.t('boards.filters.thisMonth'),
    },
    {
      value: 'quarter',
      label: this.i18n.t('boards.filters.thisQuarter'),
    },
  ]);

  ngOnInit() {
    // Initialize filters from input
    this.initializeFromFilters();
  }

  ngOnChanges() {
    // Update component state when filters input changes
    this.initializeFromFilters();
  }

  private initializeFromFilters() {
    if (this.filters.status) {
      this.selectedStatuses.set(
        Array.isArray(this.filters.status)
          ? this.filters.status
          : [this.filters.status]
      );
    }

    if (this.filters.userRole) {
      this.selectedRoles.set(
        Array.isArray(this.filters.userRole)
          ? this.filters.userRole
          : [this.filters.userRole]
      );
    }

    // Initialize other filters based on the filters object
    // This would depend on how your backend API expects these filters
  }

  // Status Filter Methods
  isStatusSelected(status: BoardStatus): boolean {
    return this.selectedStatuses().includes(status);
  }

  toggleStatus(status: BoardStatus) {
    const current = this.selectedStatuses();
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];

    this.selectedStatuses.set(updated);
    this.emitFilters();
  }

  removeStatus(status: BoardStatus) {
    const updated = this.selectedStatuses().filter((s) => s !== status);
    this.selectedStatuses.set(updated);
    this.emitFilters();
  }

  // Role Filter Methods
  isRoleSelected(role: BoardRole): boolean {
    return this.selectedRoles().includes(role);
  }

  toggleRole(role: BoardRole) {
    const current = this.selectedRoles();
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];

    this.selectedRoles.set(updated);
    this.emitFilters();
  }

  removeRole(role: BoardRole) {
    const updated = this.selectedRoles().filter((r) => r !== role);
    this.selectedRoles.set(updated);
    this.emitFilters();
  }

  // Date Range Methods
  selectDateRange(range: string) {
    this.selectedDateRange.set(range);
    this.emitFilters();
  }

  clearDateRange() {
    this.selectedDateRange.set('all');
    this.emitFilters();
  }

  // Quick Filter Methods
  toggleStarredOnly() {
    this.showStarredOnly.update((value) => !value);
    this.emitFilters();
  }

  toggleOwnedOnly() {
    this.showOwnedOnly.update((value) => !value);
    this.emitFilters();
  }

  toggleRecentActivity() {
    this.showRecentActivity.update((value) => !value);
    this.emitFilters();
  }

  // Clear Methods
  clearAll() {
    this.selectedStatuses.set([]);
    this.selectedRoles.set([]);
    this.selectedDateRange.set('all');
    this.showStarredOnly.set(false);
    this.showOwnedOnly.set(false);
    this.showRecentActivity.set(false);

    this.clearFilters.emit();
  }

  // Helper Methods
  getStatusLabel(status: BoardStatus): string {
    return this.i18n.t(`boards.status.${status.toLowerCase()}`);
  }

  getRoleLabel(role: BoardRole): string {
    return this.i18n.t(`boards.roles.${role.toLowerCase()}`);
  }

  getDateRangeLabel(range: string): string {
    return this.i18n.t(`boards.filters.${range}`);
  }

  getStatusIconClass(status: BoardStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'text-success-500';
      case 'ARCHIVED':
        return 'text-warning-500';
      case 'DELETED':
        return 'text-danger-500';
      default:
        return 'text-text-muted';
    }
  }

  getRoleIconClass(role: BoardRole): string {
    switch (role) {
      case 'OWNER':
        return 'text-primary-500';
      case 'ADMIN':
        return 'text-success-500';
      case 'MEMBER':
        return 'text-text-default';
      case 'GUEST':
        return 'text-warning-500';
      default:
        return 'text-text-muted';
    }
  }

  // Emit consolidated filters
  private emitFilters() {
    const filters: BoardQuery = {};

    // Status filters
    if (this.selectedStatuses().length > 0) {
      filters.status = this.selectedStatuses().length === 1
        ? this.selectedStatuses()[0]
        : this.selectedStatuses()[0]; // BoardQuery expects single status, take first one
    }

    // Role filters
    if (this.selectedRoles().length > 0) {
      filters.userRole = this.selectedRoles().length === 1
        ? this.selectedRoles()[0]
        : this.selectedRoles()[0]; // BoardQuery expects single role, take first one
    }

    // Date range filters
    if (this.selectedDateRange() !== 'all') {
      const now = new Date();
      switch (this.selectedDateRange()) {
        case 'today':
          filters.updatedAfter = new Date(
            now.setHours(0, 0, 0, 0)
          ).toISOString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filters.updatedAfter = weekAgo.toISOString();
          break;
        case 'month':
          const monthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
          );
          filters.updatedAfter = monthAgo.toISOString();
          break;
        case 'quarter':
          const quarterAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate()
          );
          filters.updatedAfter = quarterAgo.toISOString();
          break;
      }
    }

    // Quick filters (these would be handled by the frontend filtering logic)
    if (this.showStarredOnly()) {
      filters.starred = true;
    }

    if (this.showOwnedOnly()) {
      filters.userRole = 'OWNER';
    }

    if (this.showRecentActivity()) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      filters.updatedAfter = threeDaysAgo.toISOString();
    }

    this.filtersChange.emit(filters);
  }
}
