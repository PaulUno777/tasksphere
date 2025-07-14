import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  BarChart3,
  Activity,
} from 'lucide-angular';
import { DashboardStats } from '@core/types';
import { TranslationService } from '@core/services';

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  description?: string;
}

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="card">
      <!-- Header with Period Selector -->
      <div class="card-header flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text-default flex items-center">
          <lucide-icon
            [img]="BarChart3"
            [size]="20"
            class="mr-2 text-primary-600"
          ></lucide-icon>
          {{ i18n.translate('dashboard.overview') || 'Overview' }}
        </h2>

        <!-- Period Selector -->
        <div
          class="flex items-center space-x-1 bg-surface-muted rounded-lg p-1"
        >
          @for (period of periods; track period.value) {
          <button
            type="button"
            (click)="onPeriodChange(period.value)"
            class="px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200"
            [class.bg-primary-600]="selectedPeriod === period.value"
            [class.text-white]="selectedPeriod === period.value"
            [class.text-text-muted]="selectedPeriod !== period.value"
            [class.hover:text-text-default]="selectedPeriod !== period.value"
          >
            {{ period.label }}
          </button>
          }
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="card-body">
        @if (isLoading) {
        <!-- Loading Skeleton -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
          <div class="p-4 border border-border-default rounded-lg">
            <div class="skeleton h-4 w-16 mb-2"></div>
            <div class="skeleton h-8 w-20 mb-1"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
          }
        </div>
        } @else {
        <!-- Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (stat of statCards; track stat.id) {
          <div
            class="p-4 border border-border-default rounded-lg hover:border-primary-300 transition-colors duration-200"
          >
            <!-- Icon and Value -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  [class]="
                    'bg-' + stat.color + '-100 dark:bg-' + stat.color + '-900'
                  "
                >
                  <lucide-icon
                    [img]="stat.icon"
                    [size]="16"
                    [class]="
                      'text-' +
                      stat.color +
                      '-600 dark:text-' +
                      stat.color +
                      '-400'
                    "
                  ></lucide-icon>
                </div>
                <span
                  class="text-xs font-medium text-text-muted uppercase tracking-wide"
                >
                  {{ stat.title }}
                </span>
              </div>

              <!-- Trend Indicator -->
              @if (stat.change !== undefined) {
              <div
                class="flex items-center text-xs"
                [class.text-success-600]="stat.trend === 'up'"
                [class.text-danger-600]="stat.trend === 'down'"
                [class.text-text-muted]="stat.trend === 'neutral'"
              >
                @if (stat.trend === 'up') {
                <lucide-icon
                  [img]="TrendingUp"
                  [size]="12"
                  class="mr-1"
                ></lucide-icon>
                } @else if (stat.trend === 'down') {
                <lucide-icon
                  [img]="TrendingDown"
                  [size]="12"
                  class="mr-1"
                ></lucide-icon>
                }
                {{ formatChange(stat.change) }}
              </div>
              }
            </div>

            <!-- Main Value -->
            <div class="mb-1">
              <span class="text-2xl font-bold text-text-default">
                {{ stat.value }}
              </span>
            </div>

            <!-- Description -->
            @if (stat.description) {
            <p class="text-xs text-text-muted">
              {{ stat.description }}
            </p>
            }
          </div>
          }
        </div>

        <!-- Completion Rate Progress Bar -->
        @if (stats?.completionRate !== undefined) {
        <div class="mt-6 p-4 bg-surface-muted rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-text-default">
              {{
                i18n.translate('dashboard.completionRate') || 'Completion Rate'
              }}
            </span>
            <span class="text-sm font-bold text-primary-600">
              {{ stats?.completionRate ?? 0 }}%
            </span>
          </div>
          <div class="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
            <div
              class="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
              [style.width.%]="stats?.completionRate ?? 0"
            ></div>
          </div>

          <!-- Progress Description -->
          <p class="text-xs text-text-muted mt-1">
            {{ getCompletionDescription() }}
          </p>
        </div>
        } @if ((stats?.weeklyProgress?.length ?? 0) > 0) {
        <div class="mt-6 p-4 bg-surface-muted rounded-lg">
          <h3
            class="text-sm font-medium text-text-default mb-3 flex items-center"
          >
            <lucide-icon
              [img]="Activity"
              [size]="16"
              class="mr-2 text-primary-600"
            ></lucide-icon>
            {{ i18n.translate('dashboard.weeklyTrend') || 'Weekly Trend' }}
          </h3>

          <div class="flex items-end justify-between space-x-2 h-20">
            @for (day of stats?.weeklyProgress; track day.date) {
            <div class="flex flex-col items-center flex-1">
              <!-- Bar -->
              <div
                class="w-full bg-secondary-200 rounded-t relative mb-1"
                [style.height.px]="
                  getBarHeight(day.completed, stats?.weeklyProgress ?? [])
                "
              >
                <div
                  class="absolute inset-0 bg-primary-500 rounded-t transition-all duration-300"
                  [style.height.%]="100"
                ></div>
              </div>

              <!-- Day Label -->
              <span class="text-xs text-text-muted">
                {{ formatDayLabel(day.date) }}
              </span>
            </div>
            }
          </div>
        </div>
        } }
      </div>
    </div>
  `,
})
export class DashboardStatsComponent {
  // Lucide icons
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly Calendar = Calendar;
  readonly Target = Target;
  readonly BarChart3 = BarChart3;
  readonly Activity = Activity;

  readonly i18n = inject(TranslationService);

  @Input() stats: DashboardStats | null = null;
  @Input() isLoading = false;
  @Input() selectedPeriod: 'week' | 'month' | 'quarter' = 'week';
  @Output() periodChange = new EventEmitter<'week' | 'month' | 'quarter'>();

  periods = [
    {
      value: 'week' as const,
      label: this.i18n.translate('dashboard.week') || 'Week',
    },
    {
      value: 'month' as const,
      label: this.i18n.translate('dashboard.month') || 'Month',
    },
    {
      value: 'quarter' as const,
      label: this.i18n.translate('dashboard.quarter') || 'Quarter',
    },
  ];

  /**
   * Computed stat cards based on current stats
   */
  get statCards(): StatCard[] {
    if (!this.stats) return [];

    return [
      {
        id: 'total-tasks',
        title: this.i18n.translate('dashboard.totalTasks') || 'Total Tasks',
        value: this.stats.totalTasks,
        icon: Target,
        color: 'primary',
        description:
          this.i18n.translate('dashboard.allTasks') || 'All your tasks',
      },
      {
        id: 'completed-tasks',
        title: this.i18n.translate('dashboard.completed') || 'Completed',
        value: this.stats.completedTasks,
        change: this.calculateCompletionTrend(),
        trend: this.getCompletionTrend(),
        icon: CheckCircle,
        color: 'success',
        description:
          this.i18n.translate('dashboard.finishedTasks') || 'Finished tasks',
      },
      {
        id: 'due-today',
        title: this.i18n.translate('dashboard.dueToday') || 'Due Today',
        value: this.stats.tasksDueToday,
        icon: Clock,
        color: 'warning',
        description:
          this.i18n.translate('dashboard.tasksToday') || "Today's deadline",
      },
      {
        id: 'overdue',
        title: this.i18n.translate('dashboard.overdue') || 'Overdue',
        value: this.stats.overdueTasks,
        trend: this.stats.overdueTasks > 0 ? 'down' : 'neutral',
        icon: AlertTriangle,
        color: 'danger',
        description:
          this.i18n.translate('dashboard.pastDue') || 'Past deadline',
      },
    ];
  }

  /**
   * Handles period selection change
   */
  onPeriodChange(period: 'week' | 'month' | 'quarter'): void {
    this.periodChange.emit(period);
  }

  /**
   * Formats change percentage for display
   */
  formatChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }

  /**
   * Gets completion rate description
   */
  getCompletionDescription(): string {
    if (!this.stats) return '';

    const rate = this.stats.completionRate;

    if (rate >= 90) {
      return (
        this.i18n.translate('dashboard.excellentProgress') ||
        'Excellent progress!'
      );
    } else if (rate >= 70) {
      return this.i18n.translate('dashboard.goodProgress') || 'Good progress';
    } else if (rate >= 50) {
      return (
        this.i18n.translate('dashboard.steadyProgress') || 'Steady progress'
      );
    } else {
      return (
        this.i18n.translate('dashboard.roomForImprovement') ||
        'Room for improvement'
      );
    }
  }

  /**
   * Calculates completion trend (mock calculation)
   */
  private calculateCompletionTrend(): number {
    if (!this.stats?.weeklyProgress || this.stats.weeklyProgress.length < 2) {
      return 0;
    }

    const recent = this.stats.weeklyProgress.slice(-3);
    const older = this.stats.weeklyProgress.slice(0, -3);

    const recentAvg =
      recent.reduce((sum, day) => sum + day.completed, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, day) => sum + day.completed, 0) / (older.length || 1);

    return Math.round(((recentAvg - olderAvg) / (olderAvg || 1)) * 100);
  }

  /**
   * Gets completion trend direction
   */
  private getCompletionTrend(): 'up' | 'down' | 'neutral' {
    const change = this.calculateCompletionTrend();

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'neutral';
  }

  /**
   * Calculates bar height for trend chart
   */
  getBarHeight(value: number, data: any[]): number {
    const max = Math.max(...data.map((d) => d.completed));
    const min = Math.min(...data.map((d) => d.completed));
    const range = max - min || 1;

    // Normalize to 16-64px range
    return 16 + ((value - min) / range) * 48;
  }

  /**
   * Formats day label for trend chart
   */
  formatDayLabel(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
