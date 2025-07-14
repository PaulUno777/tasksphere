import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  UserPlus,
  CheckSquare,
  Calendar,
  ArrowRight,
  Zap,
  Star,
  Clock,
  Users,
} from 'lucide-angular';
import { QuickAction } from '@core/types';
import { TranslationService } from '@core/services';

/**
 * QuickActionsComponent displays actionable shortcuts on the dashboard
 * Provides easy access to common tasks like creating boards and viewing tasks
 */
@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="card">
      <!-- Header -->
      <div class="card-header">
        <h2 class="text-lg font-semibold text-text-default flex items-center">
          <lucide-icon
            [img]="Zap"
            [size]="20"
            class="mr-2 text-primary-600"
          ></lucide-icon>
          {{ i18n.t('dashboard.quickActions') || 'Quick Actions' }}
        </h2>
        <p class="text-sm text-text-muted mb-2">
          {{
            i18n.t('dashboard.quickActionsDescription') ||
              'Get things done faster'
          }}
        </p>
      </div>

      <!-- Actions Grid -->
      <div class="card-body">
        @if (isLoading) {
        <!-- Loading Skeleton -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
          <div class="p-4 border border-border-default rounded-lg">
            <div class="skeleton w-8 h-8 rounded-lg mb-3"></div>
            <div class="skeleton h-4 w-20 mb-2"></div>
            <div class="skeleton h-3 w-full"></div>
          </div>
          }
        </div>
        } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (action of actions; track action.id) {
          <div class="group relative">
            <!-- Action Card -->
            <a
              [routerLink]="action.route"
              class="block p-4 border border-border-default rounded-lg transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-1"
              [class.opacity-50]="!action.enabled"
              [class.cursor-not-allowed]="!action.enabled"
              [attr.aria-disabled]="!action.enabled"
            >
              <!-- Icon -->
              <div
                class="w-10 h-10 rounded-lg mb-3 flex items-center justify-center transition-colors duration-200"
                [class]="getIconClasses(action.color)"
                [class.group-hover:scale-110]="action.enabled"
              >
                <lucide-icon
                  [img]="getActionIcon(action.icon)"
                  [size]="20"
                  [class]="getIconTextClasses(action.color)"
                ></lucide-icon>
              </div>

              <!-- Content -->
              <div class="mb-3">
                <h3
                  class="text-sm font-semibold text-text-default mb-1 group-hover:text-primary-600 transition-colors duration-200"
                >
                  {{ i18n.t('dashboard.actions.' + action.id) || action.title }}
                </h3>
                <p class="text-xs text-text-muted">
                  {{
                    i18n.t('dashboard.actions.' + action.id + 'description') ||
                      action.description
                  }}
                </p>
              </div>

              <!-- Arrow -->
              @if (action.enabled) {
              <div class="flex items-center justify-end">
                <lucide-icon
                  [img]="ArrowRight"
                  [size]="16"
                  class="text-text-muted group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200"
                ></lucide-icon>
              </div>
              }

              <!-- Disabled Overlay -->
              @if (!action.enabled) {
              <div
                class="absolute inset-0 bg-surface bg-opacity-50 rounded-lg flex items-center justify-center"
              >
                <span
                  class="text-xs text-text-muted bg-surface px-2 py-1 rounded border border-border-default"
                >
                  {{ i18n.t('common.comingSoon') || 'Coming Soon' }}
                </span>
              </div>
              }
            </a>

            <!-- Tooltip for disabled actions -->
            @if (!action.enabled) {
            <div
              class="absolute -top-2 -right-2 w-5 h-5 bg-warning-100 rounded-full flex items-center justify-center border-2 border-white"
            >
              <lucide-icon
                [img]="Clock"
                [size]="12"
                class="text-warning-600"
              ></lucide-icon>
            </div>
            }
          </div>
          }
        </div>

        <!-- Additional Actions Row -->
        <div class="mt-6 pt-6 border-t border-border-default">
          <div class="flex flex-wrap gap-3">
            <!-- View All Boards -->
            <a
              routerLink="/boards"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <lucide-icon [img]="Users" [size]="16" class="mr-2"></lucide-icon>
              {{ i18n.t('dashboard.viewAllBoards') || 'View All Boards' }}
            </a>

            <!-- View All Tasks -->
            <a
              routerLink="/tasks"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <lucide-icon
                [img]="CheckSquare"
                [size]="16"
                class="mr-2"
              ></lucide-icon>
              {{ i18n.t('dashboard.viewAllTasks') || 'View All Tasks' }}
            </a>

            <!-- Calendar View -->
            <a
              routerLink="/calendar"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-text-muted hover:text-text-default hover:bg-surface-muted rounded-lg transition-colors duration-200"
            >
              <lucide-icon
                [img]="Calendar"
                [size]="16"
                class="mr-2"
              ></lucide-icon>
              {{ i18n.t('dashboard.calendarView') || 'Calendar View' }}
              <span
                class="ml-2 text-xs text-warning-600 bg-warning-100 px-2 py-0.5 rounded-full"
              >
                {{ i18n.t('common.soon') || 'Soon' }}
              </span>
            </a>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class QuickActionsComponent {
  // Lucide icons
  readonly Plus = Plus;
  readonly UserPlus = UserPlus;
  readonly CheckSquare = CheckSquare;
  readonly Calendar = Calendar;
  readonly ArrowRight = ArrowRight;
  readonly Zap = Zap;
  readonly Star = Star;
  readonly Clock = Clock;
  readonly Users = Users;

  readonly i18n = inject(TranslationService);

  @Input() actions: QuickAction[] = [];
  @Input() isLoading = false;

  getActionIcon(iconName: string): any {
    const iconMap: Record<string, any> = {
      Plus: Plus,
      UserPlus: UserPlus,
      CheckSquare: CheckSquare,
      Calendar: Calendar,
      Users: Users,
      Star: Star,
    };

    return iconMap[iconName] || Plus;
  }

  getIconClasses(color: string): string {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary-100 dark:bg-primary-900',
      secondary: 'bg-secondary-100 dark:bg-secondary-900',
      accent: 'bg-accent-100 dark:bg-accent-900',
      success: 'bg-success-100 dark:bg-success-900',
      warning: 'bg-warning-100 dark:bg-warning-900',
      danger: 'bg-danger-100 dark:bg-danger-900',
    };

    return colorMap[color] || colorMap['primary'];
  }

  getIconTextClasses(color: string): string {
    const colorMap: Record<string, string> = {
      primary: 'text-primary-600 dark:text-primary-400',
      secondary: 'text-secondary-600 dark:text-secondary-400',
      accent: 'text-accent-600 dark:text-accent-400',
      success: 'text-success-600 dark:text-success-400',
      warning: 'text-warning-600 dark:text-warning-400',
      danger: 'text-danger-600 dark:text-danger-400',
    };

    return colorMap[color] || colorMap['primary'];
  }
}
