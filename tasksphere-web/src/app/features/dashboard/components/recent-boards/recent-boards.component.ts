import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  SquareKanban,
  Plus,
  MoreHorizontal,
  Users,
  Clock,
  ChevronRight,
} from 'lucide-angular';
import { Board } from '@core/models';
import { TranslationService } from '@core/services';

/**
 * BoardSummary interface for the recent boards summary
 */
interface BoardSummary {
  total: number;
  active: number;
  hasMore: boolean;
}

/**
 * RecentBoardsComponent displays user's recently accessed boards
 * Shows board cards with quick access and member information
 */
@Component({
  selector: 'app-recent-boards',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="card">
      <!-- Header -->
      <div class="card-header flex items-center justify-between">
        <h3 class="text-lg font-semibold text-text-default flex items-center">
          <lucide-icon
            [img]="SquareKanban"
            [size]="20"
            class="mr-2 text-primary-600"
          ></lucide-icon>
          {{ i18n.translate('dashboard.recentBoards') || 'Recent Boards' }}
          @if (summary?.total) {
          <span class="ml-2 text-sm text-text-muted"
            >({{ summary?.total }})</span
          >
          }
        </h3>

        <!-- View all boards -->
        @if (summary?.hasMore) {
        <a
          routerLink="/boards"
          class="text-sm text-primary-600 hover:text-primary-700 flex items-center"
        >
          {{ i18n.translate('dashboard.viewAllBoards') || 'View all' }}
          <lucide-icon
            [img]="ChevronRight"
            [size]="14"
            class="ml-1"
          ></lucide-icon>
        </a>
        }
      </div>

      <div class="card-body p-0">
        @if (isLoading) {
        <!-- Loading skeleton -->
        <div class="space-y-4 p-4">
          @for (i of [1,2,3]; track i) {
          <div class="flex items-center space-x-3">
            <div class="skeleton w-12 h-12 rounded-lg"></div>
            <div class="flex-1">
              <div class="skeleton h-4 w-3/4 mb-2"></div>
              <div class="skeleton h-3 w-1/2"></div>
            </div>
          </div>
          }
        </div>
        } @else if (boards.length === 0) {
        <!-- Empty state -->
        <div class="text-center py-12 px-4">
          <lucide-icon
            [img]="SquareKanban"
            [size]="48"
            class="mx-auto text-text-muted mb-4"
          ></lucide-icon>
          <p class="text-text-muted mb-4">
            {{
              i18n.translate('dashboard.noRecentBoards') || 'No recent boards'
            }}
          </p>
          <a routerLink="/boards/new" class="btn-primary btn-sm">
            <lucide-icon [img]="Plus" [size]="14" class="mr-2"></lucide-icon>
            {{
              i18n.translate('dashboard.createFirstBoard') ||
                'Create your first board'
            }}
          </a>
        </div>
        } @else {
        <!-- Boards list -->
        <div class="divide-y divide-border-default">
          @for (board of boards; track board.id) {
          <div
            class="flex items-center space-x-3 p-4 hover:bg-surface-muted transition-colors duration-200 cursor-pointer group"
            [routerLink]="['/boards', board.id]"
          >
            <!-- Board Icon -->
            <div class="flex-shrink-0">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center"
                [style.backgroundColor]="board.color || '#3B82F6'"
              >
                <lucide-icon
                  [img]="SquareKanban"
                  [size]="20"
                  class="text-white"
                ></lucide-icon>
              </div>
            </div>

            <!-- Board Content -->
            <div class="flex-1 min-w-0">
              <!-- Title -->
              <h4 class="text-sm font-semibold text-text-default truncate">
                {{ board.title }}
              </h4>

              <!-- Description -->
              @if (board.description) {
              <p class="text-xs text-text-muted mt-1 truncate">
                {{ board.description }}
              </p>
              }

              <!-- Meta info -->
              <div
                class="flex items-center space-x-3 mt-2 text-xs text-text-muted"
              >
                <!-- Members -->
                @if (board.memberCount && board.memberCount > 0) {
                <div class="flex items-center">
                  <lucide-icon
                    [img]="Users"
                    [size]="12"
                    class="mr-1"
                  ></lucide-icon>
                  <span
                    >{{ board.memberCount }}
                    {{ board.memberCount === 1 ? 'member' : 'members' }}</span
                  >
                </div>
                }

                <!-- Last activity -->
                @if (board.updatedAt) {
                <div class="flex items-center">
                  <lucide-icon
                    [img]="Clock"
                    [size]="12"
                    class="mr-1"
                  ></lucide-icon>
                  <span>{{
                    formatLastActivity(board.updatedAt)
                  }}</span>
                </div>
                }
              </div>
            </div>

            <!-- Status indicator -->
            <div class="flex-shrink-0">
              <div
                class="w-2 h-2 rounded-full"
                [class.bg-success-500]="board.status === 'ACTIVE'"
                [class.bg-warning-500]="board.status === 'ARCHIVED'"
                [class.bg-neutral-400]="board.status === 'DELETED'"
              ></div>
            </div>

            <!-- Action menu -->
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-surface-muted rounded transition-all duration-200"
              (click)="$event.stopPropagation()"
              [attr.aria-label]="'Board options'"
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

        <!-- Summary footer -->
        @if (summary && summary.total > 0) {
        <div class="p-4 bg-surface-subtle border-t border-border-default">
          <div
            class="flex items-center justify-between text-xs text-text-muted"
          >
            <span>
              {{ summary.active }} of {{ summary.total }} boards active
            </span>
            @if (summary.hasMore) {
            <a
              routerLink="/boards"
              class="text-primary-600 hover:text-primary-700"
            >
              {{
                i18n.translate('dashboard.viewAllBoards') || 'View all boards'
              }}
            </a>
            }
          </div>
        </div>
        } }
      </div>
    </div>
  `,
})
export class RecentBoardsComponent {
  // Lucide icons
  protected readonly SquareKanban = SquareKanban;
  protected readonly Plus = Plus;
  protected readonly MoreHorizontal = MoreHorizontal;
  protected readonly Users = Users;
  protected readonly Clock = Clock;
  protected readonly ChevronRight = ChevronRight;

  readonly i18n = inject(TranslationService);

  @Input() boards: Board[] = [];
  @Input() summary: BoardSummary | null = null;
  @Input() isLoading = false;

  /**
   * Formats last activity time for display
   */
  formatLastActivity(updatedAt: string): string {
    const date = new Date(updatedAt);
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
}
