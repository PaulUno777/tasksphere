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
import {
  LucideAngularModule,
  MoreVertical,
  Star,
  StarOff,
  Users,
  Calendar,
  Archive,
  Edit,
  Settings,
  Copy,
  Trash2,
  RotateCcw,
  Lock,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-angular';

import { Board } from '@core/models';
import { TranslationService } from '@core/services';
import {
  DropdownMenuComponent,
  DropdownMenuItem,
} from '@shared/components/dropdown-menu/dropdown-menu';
import { BadgeComponent } from '@shared/components/badge/badge';

export interface BoardAction {
  type:
    | 'edit'
    | 'archive'
    | 'restore'
    | 'delete'
    | 'settings'
    | 'duplicate'
    | 'star';
  board: Board;
}

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DropdownMenuComponent,
    BadgeComponent,
  ],
  template: `
    <!-- Grid View -->
    @if (viewMode === 'grid') {
    <div
      class="group relative bg-surface border border-border-default rounded-lg p-6 hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer"
      (click)="onBoardClick()"
      [class.opacity-60]="board.status === 'ARCHIVED'"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <!-- Board Color Indicator -->
        <div
          class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
          [style.background-color]="board.color || '#6b7280'"
        >
          {{ getBoardInitials(board.title) }}
        </div>

        <!-- Actions Menu -->
        <div
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          (click)="$event.stopPropagation()"
        >
          <app-dropdown-menu
            [items]="getMenuItems()"
            [trigger]="'click'"
            [placement]="'bottom-end'"
          >
            <button
              class="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-default transition-colors"
              [attr.aria-label]="i18n.t('common.more')"
            >
              <lucide-icon [img]="MoreVertical" [size]="16"></lucide-icon>
            </button>
          </app-dropdown-menu>
        </div>
      </div>

      <!-- Board Info -->
      <div class="mb-4">
        <h3
          class="text-lg font-semibold text-text-default mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors"
        >
          {{ board.title }}
        </h3>

        @if (board.description) {
        <p class="text-sm text-text-muted line-clamp-2 mb-3">
          {{ board.description }}
        </p>
        }

        <!-- Status Badge -->
        @if (board.status !== 'ACTIVE') {
        <app-badge
          [variant]="getBadgeVariant(board.status)"
          [size]="'sm'"
          class="mb-3"
        >
          <lucide-icon
            [img]="getStatusIcon(board.status)"
            [size]="12"
            class="mr-1"
          ></lucide-icon>
          {{ getStatusLabel(board.status) }}
        </app-badge>
        }
      </div>

      <!-- Footer -->
      <div class="space-y-3">
        <!-- Members and Stats -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-4">
            <!-- Members -->
            @if (board.memberCount > 0) {
            <div class="flex items-center text-text-muted">
              <lucide-icon [img]="Users" [size]="14" class="mr-1"></lucide-icon>
              <span>{{ board.memberCount }}</span>
            </div>
            }

            <!-- Role -->
            <div class="flex items-center">
              <app-badge
                [variant]="getRoleBadgeVariant(board.userRole)"
                [size]="'sm'"
              >
                {{ getRoleLabel(board.userRole) }}
              </app-badge>
            </div>
          </div>

          <!-- Privacy Indicator -->
          @if (isPrivateBoard()) {
          <div class="flex items-center text-text-muted">
            <lucide-icon [img]="Lock" [size]="14"></lucide-icon>
          </div>
          }
        </div>

        <!-- Last Updated -->
        <div class="flex items-center justify-between text-xs text-text-muted">
          <div class="flex items-center">
            <lucide-icon
              [img]="Calendar"
              [size]="12"
              class="mr-1"
            ></lucide-icon>
            <span>{{ formatDate(board.updatedAt) }}</span>
          </div>

          <!-- Favorite Star -->
          <button
            (click)="toggleStar($event)"
            class="p-1 rounded hover:bg-surface-muted transition-colors"
            [class.text-warning-500]="isStarred()"
            [class.text-text-muted]="!isStarred()"
          >
            <lucide-icon
              [img]="isStarred() ? Star : StarOff"
              [size]="14"
            ></lucide-icon>
          </button>
        </div>
      </div>
    </div>
    }

    <!-- List View -->
    @else {
    <div
      class="group bg-surface border border-border-default rounded-lg p-4 hover:shadow-sm hover:border-primary-200 transition-all duration-200 cursor-pointer"
      (click)="onBoardClick()"
      [class.opacity-60]="board.status === 'ARCHIVED'"
    >
      <div class="flex items-center justify-between">
        <!-- Left Section -->
        <div class="flex items-center space-x-4 flex-1 min-w-0">
          <!-- Board Color Indicator -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
            [style.background-color]="board.color || '#6b7280'"
          >
            {{ getBoardInitials(board.title) }}
          </div>

          <!-- Board Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-3 mb-1">
              <h3
                class="text-base font-semibold text-text-default truncate group-hover:text-primary-600 transition-colors"
              >
                {{ board.title }}
              </h3>

              <!-- Status Badge -->
              @if (board.status !== 'ACTIVE') {
              <app-badge
                [variant]="getBadgeVariant(board.status)"
                [size]="'sm'"
              >
                <lucide-icon
                  [img]="getStatusIcon(board.status)"
                  [size]="10"
                  class="mr-1"
                ></lucide-icon>
                {{ getStatusLabel(board.status) }}
              </app-badge>
              }

              <!-- Privacy Indicator -->
              @if (isPrivateBoard()) {
              <lucide-icon
                [img]="Lock"
                [size]="14"
                class="text-text-muted"
              ></lucide-icon>
              }
            </div>

            @if (board.description) {
            <p class="text-sm text-text-muted truncate">
              {{ board.description }}
            </p>
            }
          </div>
        </div>

        <!-- Right Section -->
        <div class="flex items-center space-x-6 flex-shrink-0">
          <!-- Role Badge -->
          <app-badge
            [variant]="getRoleBadgeVariant(board.userRole)"
            [size]="'sm'"
          >
            {{ getRoleLabel(board.userRole) }}
          </app-badge>

          <!-- Members Count -->
          @if (board.memberCount > 0) {
          <div class="flex items-center text-sm text-text-muted">
            <lucide-icon [img]="Users" [size]="14" class="mr-1"></lucide-icon>
            <span>{{ board.memberCount }}</span>
          </div>
          }

          <!-- Last Updated -->
          <div class="flex items-center text-sm text-text-muted min-w-0">
            <lucide-icon
              [img]="Calendar"
              [size]="14"
              class="mr-1 flex-shrink-0"
            ></lucide-icon>
            <span class="truncate">{{ formatDate(board.updatedAt) }}</span>
          </div>

          <!-- Star Button -->
          <button
            (click)="toggleStar($event)"
            class="p-1.5 rounded hover:bg-surface-muted transition-colors flex-shrink-0"
            [class.text-warning-500]="isStarred()"
            [class.text-text-muted]="!isStarred()"
          >
            <lucide-icon
              [img]="isStarred() ? Star : StarOff"
              [size]="16"
            ></lucide-icon>
          </button>

          <!-- Actions Menu -->
          <div
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            (click)="$event.stopPropagation()"
          >
            <app-dropdown-menu
              [items]="getMenuItems()"
              [trigger]="'click'"
              [placement]="'bottom-end'"
            >
              <button
                class="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-default transition-colors"
                [attr.aria-label]="i18n.t('common.more')"
              >
                <lucide-icon [img]="MoreVertical" [size]="16"></lucide-icon>
              </button>
            </app-dropdown-menu>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class BoardCardComponent {
  // Icons
  readonly MoreVertical = MoreVertical;
  readonly Star = Star;
  readonly StarOff = StarOff;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly Archive = Archive;
  readonly Edit = Edit;
  readonly Settings = Settings;
  readonly Copy = Copy;
  readonly Trash2 = Trash2;
  readonly RotateCcw = RotateCcw;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;

  // Services
  i18n = inject(TranslationService);

  // Inputs
  @Input({ required: true }) board!: Board;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Output() boardClick = new EventEmitter<string>();
  @Output() menuAction = new EventEmitter<BoardAction>();

  // Component State
  private starredBoards = signal<Set<string>>(new Set());
  isStarred = computed(() => this.starredBoards().has(this.board.id));

  constructor() {
    this.loadStarredBoards();
  }

  private loadStarredBoards() {
    try {
      const starred = localStorage.getItem('starredBoards');
      if (starred) {
        this.starredBoards.set(new Set(JSON.parse(starred)));
      }
    } catch (error) {
      console.warn('Failed to load starred boards:', error);
    }
  }

  private saveStarredBoards() {
    try {
      localStorage.setItem(
        'starredBoards',
        JSON.stringify([...this.starredBoards()])
      );
    } catch (error) {
      console.warn('Failed to save starred boards:', error);
    }
  }

  // Event Handlers
  onBoardClick() {
    this.boardClick.emit(this.board.id);
  }

  toggleStar(event: Event) {
    event.stopPropagation();
    const starred = new Set(this.starredBoards());

    if (starred.has(this.board.id)) {
      starred.delete(this.board.id);
    } else {
      starred.add(this.board.id);
    }

    this.starredBoards.set(starred);
    this.saveStarredBoards();

    this.menuAction.emit({ type: 'star', board: this.board });
  }

  // Menu Configuration
  getMenuItems(): DropdownMenuItem[] {
    const items: DropdownMenuItem[] = [];

    // Common items for all users
    items.push({
      id: 'edit',
      label: this.i18n.t('common.edit'),
      icon: Edit,
      action: () => this.menuAction.emit({ type: 'edit', board: this.board }),
    });

    items.push({
      id: 'duplicate',
      label: this.i18n.t('common.duplicate'),
      icon: Copy,
      action: () =>
        this.menuAction.emit({ type: 'duplicate', board: this.board }),
    });

    // Admin/Owner specific actions
    if (this.canManageBoard()) {
      items.push({
        id: 'divider-1',
        type: 'divider',
        label: '',
        action: () => {},
      });

      items.push({
        id: 'settings',
        label: this.i18n.t('common.settings'),
        icon: Settings,
        action: () =>
          this.menuAction.emit({ type: 'settings', board: this.board }),
      });

      if (this.board.status === 'ACTIVE') {
        items.push({
          id: 'archive',
          label: this.i18n.t('common.archive'),
          icon: Archive,
          action: () =>
            this.menuAction.emit({ type: 'archive', board: this.board }),
        });
      } else if (this.board.status === 'ARCHIVED') {
        items.push({
          id: 'restore',
          label: this.i18n.t('common.restore'),
          icon: RotateCcw,
          action: () =>
            this.menuAction.emit({ type: 'restore', board: this.board }),
        });
      }

      // Only owners can delete
      if (this.board.userRole === 'OWNER') {
        items.push({
          id: 'divider-2',
          type: 'divider',
          label: '',
          action: () => {},
        });
        items.push({
          id: 'delete',
          label: this.i18n.t('common.delete'),
          icon: Trash2,
          variant: 'danger',
          action: () =>
            this.menuAction.emit({ type: 'delete', board: this.board }),
        });
      }
    }

    return items;
  }

  // Helper Methods
  getBoardInitials(title: string): string {
    return title
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.i18n.t('common.today');
    } else if (diffDays === 1) {
      return this.i18n.t('common.yesterday');
    } else if (diffDays < 7) {
      return this.i18n.t('common.daysAgo', { days: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  }

  getBadgeVariant(
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ARCHIVED':
        return 'warning';
      case 'DELETED':
        return 'danger';
      default:
        return 'default';
    }
  }

  getRoleBadgeVariant(
    role: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    switch (role) {
      case 'OWNER':
        return 'primary';
      case 'ADMIN':
        return 'success';
      case 'MEMBER':
        return 'default';
      case 'GUEST':
        return 'warning';
      default:
        return 'default';
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'ACTIVE':
        return CheckCircle;
      case 'ARCHIVED':
        return Archive;
      case 'DELETED':
        return Trash2;
      default:
        return Clock;
    }
  }

  getStatusLabel(status: string): string {
    return this.i18n.t(`boards.status.${status.toLowerCase()}`);
  }

  getRoleLabel(role: string): string {
    return this.i18n.t(`boards.roles.${role.toLowerCase()}`);
  }

  isPrivateBoard(): boolean {
    // Assuming boards have privacy settings
    return this.board.settings?.requireInviteApproval || false;
  }

  canManageBoard(): boolean {
    return this.board.userRole === 'OWNER' || this.board.userRole === 'ADMIN';
  }
}
