import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Activity,
  MessageCircle,
  UserPlus,
  CheckSquare,
  Plus,
  SquareKanban,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Check,
} from 'lucide-angular';
import { TranslationService } from '@core/services';
import { ActivityItem } from '@core/types';

/**
 * ActivityFeedComponent displays recent activity items
 * Shows a chronological list of user and board activities
 */
@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="card">
      <!-- Header -->
      <div class="card-header flex items-center justify-between">
        <h3 class="text-lg font-semibold text-text-default flex items-center">
          <lucide-icon
            [img]="Activity"
            [size]="20"
            class="mr-2 text-primary-600"
          ></lucide-icon>
          {{ i18n.translate('dashboard.recentActivity') || 'Recent Activity' }}
          @if (unreadCount > 0) {
          <span class="ml-2 badge badge-sm badge-danger">{{
            unreadCount
          }}</span>
          }
        </h3>

        <!-- Mark all as read -->
        @if (unreadCount > 0) {
        <button
          type="button"
          (click)="onMarkAllAsRead()"
          class="text-sm text-primary-600 hover:text-primary-700 flex items-center"
        >
          <lucide-icon [img]="Check" [size]="14" class="mr-1"></lucide-icon>
          {{ i18n.translate('dashboard.markAllRead') || 'Mark all read' }}
        </button>
        }
      </div>

      <div class="card-body p-0">
        @if (isLoading) {
        <!-- Loading skeleton -->
        @for (i of [1,2,3,4,5]; track i) {
        <div
          class="flex items-start space-x-3 p-4 border-b border-border-default last:border-b-0"
        >
          <div class="skeleton w-8 h-8 rounded-full"></div>
          <div class="flex-1">
            <div class="skeleton h-3 w-3/4 mb-2"></div>
            <div class="skeleton h-3 w-1/2"></div>
          </div>
        </div>
        } } @else if (activities.length === 0) {
        <!-- Empty state -->
        <div class="text-center py-12 px-4">
          <lucide-icon
            [img]="Activity"
            [size]="48"
            class="mx-auto text-text-muted mb-4"
          ></lucide-icon>
          <p class="text-text-muted">
            {{
              i18n.translate('dashboard.noRecentActivity') ||
                'No recent activity'
            }}
          </p>
        </div>
        } @else {
        <!-- Activity list -->
        <div class="divide-y divide-border-default">
          @for (activity of activities; track activity.id) {
          <div
            class="flex items-start space-x-3 p-4 hover:bg-surface-muted transition-colors duration-200 cursor-pointer"
            [class.bg-primary-50]="!activity.isRead"
            [class.dark:bg-primary-950]="!activity.isRead"
            (click)="onActivityClick(activity)"
          >
            <!-- Activity Icon -->
            <div class="flex-shrink-0">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center"
                [class]="getActivityIconClasses(activity.type)"
              >
                <lucide-icon
                  [img]="getActivityIcon(activity.type)"
                  [size]="16"
                  [class]="getActivityIconTextClasses(activity.type)"
                ></lucide-icon>
              </div>
            </div>

            <!-- Activity Content -->
            <div class="flex-1 min-w-0">
              <!-- Title -->
              <p
                class="text-sm text-text-default"
                [class.font-semibold]="!activity.isRead"
              >
                {{ activity.title }}
              </p>

              <!-- Description -->
              @if (activity.description) {
              <p class="text-xs text-text-muted mt-1">
                {{ activity.description }}
              </p>
              }

              <!-- Meta info -->
              <div
                class="flex items-center space-x-2 mt-2 text-xs text-text-muted"
              >
                <!-- User -->
                <span
                  >{{ activity.user.firstName }}
                  {{ activity.user.lastName }}</span
                >

                <!-- Board -->
                @if (activity.board) {
                <span>"</span>
                <span>{{ activity.board.title }}</span>
                }

                <!-- Time -->
                <span>"</span>
                <span>{{ formatActivityTime(activity.createdAt) }}</span>
              </div>
            </div>

            <!-- Unread indicator -->
            @if (!activity.isRead) {
            <div class="flex-shrink-0">
              <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
            </div>
            }

            <!-- Action menu -->
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-surface-muted rounded transition-all duration-200"
              (click)="$event.stopPropagation()"
              [attr.aria-label]="'Activity options'"
            >
              <lucide-icon
                [img]="MoreHorizontal"
                [size]="16"
                class="text-text-muted"
              ></lucide-icon>
            </button>
          </div>
          }
        </div>

        <!-- View more activities -->
        @if (activities.length >= 10) {
        <div class="p-4 text-center border-t border-border-default">
          <a
            routerLink="/activity"
            class="text-sm text-primary-600 hover:text-primary-700"
          >
            {{
              i18n.translate('dashboard.viewAllActivity') || 'View all activity'
            }}
          </a>
        </div>
        } }
      </div>
    </div>
  `,
})
export class ActivityFeedComponent {
  // Lucide icons
  protected readonly Activity = Activity;
  protected readonly MessageCircle = MessageCircle;
  protected readonly UserPlus = UserPlus;
  protected readonly CheckSquare = CheckSquare;
  protected readonly Plus = Plus;
  protected readonly SquareKanban = SquareKanban;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Clock = Clock;
  protected readonly MoreHorizontal = MoreHorizontal;
  protected readonly Check = Check;

  readonly i18n = inject(TranslationService);

  @Input() activities: ActivityItem[] = [];
  @Input() unreadCount = 0;
  @Input() isLoading = false;

  @Output() markAsRead = new EventEmitter<string[]>();
  @Output() markAllAsRead = new EventEmitter<void>();

  /**
   * Gets the appropriate icon for activity type
   */
  getActivityIcon(type: string): any {
    const iconMap: Record<string, any> = {
      TASK_CREATED: Plus,
      TASK_COMPLETED: CheckSquare,
      TASK_ASSIGNED: UserPlus,
      BOARD_CREATED: SquareKanban,
      MEMBER_JOINED: UserPlus,
      COMMENT_ADDED: MessageCircle,
      TASK_OVERDUE: AlertTriangle,
    };

    return iconMap[type] || Activity;
  }

  /**
   * Gets CSS classes for activity icon background
   */
  getActivityIconClasses(type: string): string {
    const classMap: Record<string, string> = {
      TASK_CREATED: 'bg-primary-100 dark:bg-primary-900',
      TASK_COMPLETED: 'bg-success-100 dark:bg-success-900',
      TASK_ASSIGNED: 'bg-accent-100 dark:bg-accent-900',
      BOARD_CREATED: 'bg-primary-100 dark:bg-primary-900',
      MEMBER_JOINED: 'bg-secondary-100 dark:bg-secondary-900',
      COMMENT_ADDED: 'bg-accent-100 dark:bg-accent-900',
      TASK_OVERDUE: 'bg-danger-100 dark:bg-danger-900',
    };

    return classMap[type] || 'bg-neutral-100 dark:bg-neutral-900';
  }

  /**
   * Gets CSS classes for activity icon text color
   */
  getActivityIconTextClasses(type: string): string {
    const classMap: Record<string, string> = {
      TASK_CREATED: 'text-primary-600 dark:text-primary-400',
      TASK_COMPLETED: 'text-success-600 dark:text-success-400',
      TASK_ASSIGNED: 'text-accent-600 dark:text-accent-400',
      BOARD_CREATED: 'text-primary-600 dark:text-primary-400',
      MEMBER_JOINED: 'text-secondary-600 dark:text-secondary-400',
      COMMENT_ADDED: 'text-accent-600 dark:text-accent-400',
      TASK_OVERDUE: 'text-danger-600 dark:text-danger-400',
    };

    return classMap[type] || 'text-neutral-600 dark:text-neutral-400';
  }

  /**
   * Formats activity time for display
   */
  formatActivityTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return this.i18n.translate('common.justNow') || 'Just now';
    } else if (diffMinutes < 60) {
      return (
        this.i18n.translate('common.minutesAgo', { minutes: diffMinutes }) ||
        `${diffMinutes}m ago`
      );
    } else if (diffHours < 24) {
      return (
        this.i18n.translate('common.hoursAgo', { hours: diffHours }) ||
        `${diffHours}h ago`
      );
    } else if (diffDays < 7) {
      return (
        this.i18n.translate('common.daysAgo', { days: diffDays }) ||
        `${diffDays}d ago`
      );
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Handles activity item click
   */
  onActivityClick(activity: ActivityItem): void {
    // Mark as read if not already read
    if (!activity.isRead) {
      this.markAsRead.emit([activity.id]);
    }

    // Navigate to relevant page based on activity type
    // This would be implemented based on your routing structure
  }

  onMarkAllAsRead(): void {
    this.markAllAsRead.emit();
  }
}