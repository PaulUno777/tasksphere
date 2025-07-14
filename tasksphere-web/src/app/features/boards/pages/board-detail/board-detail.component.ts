import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Settings,
  Users,
  Star,
  StarOff,
  MoreVertical,
  Plus,
  Filter,
  Search,
  Calendar,
  Archive,
  Eye,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-angular';

import { Board, Task, Category, BoardMember, User } from '@core/models';
import { AvatarData } from '@shared/components/avatar-group/avatar-group';
import {
  TranslationService,
  BoardService,
  TaskService,
  CategoryService,
  ToastService,
} from '@core/services';
import { ButtonComponent } from '@shared/components/button/button';
import { BadgeComponent } from '@shared/components/badge/badge';
import { AvatarGroupComponent } from '@shared/components/avatar-group/avatar-group';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state';
import {
  DropdownMenuComponent,
  DropdownMenuItem,
} from '@shared/components/dropdown-menu/dropdown-menu';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    ButtonComponent,
    BadgeComponent,
    AvatarGroupComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    DropdownMenuComponent,
  ],
  template: `
    <div class="min-h-screen bg-background">
      @if (isLoading()) {
      <div class="flex items-center justify-center min-h-screen">
        <app-loading-spinner size="lg"></app-loading-spinner>
      </div>
      } @else if (error()) {
      <div class="flex items-center justify-center min-h-screen">
        <app-empty-state
          [icon]="'AlertCircle'"
          [title]="i18n.t('boards.detail.error')"
          [description]="error() || ''"
        >
          <app-button (click)="loadBoard()">
            {{ i18n.t('common.retry') }}
          </app-button>
        </app-empty-state>
      </div>
      } @else if (board()) {
      <!-- Header -->
      <div class="bg-surface border-b border-border-default">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button
                (click)="goBack()"
                class="p-2 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-default transition-colors"
                [attr.aria-label]="i18n.t('common.back')"
              >
                <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
              </button>

              <div class="flex items-center space-x-3">
                <!-- Board Color Indicator -->
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                  [style.background-color]="board()!.color"
                >
                  {{ board()!.title.charAt(0).toUpperCase() }}
                </div>

                <div>
                  <div class="flex items-center space-x-2">
                    <h1 class="text-xl font-semibold text-text-default">
                      {{ board()!.title }}
                    </h1>
                    <button
                      (click)="toggleStar()"
                      class="p-1 rounded hover:bg-surface-muted transition-colors"
                      [class.text-warning-500]="isStarred()"
                      [class.text-text-muted]="!isStarred()"
                    >
                      <lucide-icon
                        [img]="isStarred() ? Star : StarOff"
                        [size]="16"
                      ></lucide-icon>
                    </button>

                    <!-- Status Badge -->
                    <app-badge
                      [variant]="
                        board()!.status === 'ACTIVE' ? 'success' : 'warning'
                      "
                      size="sm"
                    >
                      {{
                        i18n.t('boards.status.' + board()!.status.toLowerCase())
                      }}
                    </app-badge>
                  </div>

                  @if (board()!.description) {
                  <p class="text-sm text-text-muted mt-1">
                    {{ board()!.description }}
                  </p>
                  }
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <!-- Members -->
              @if (boardMembers().length > 0) {
              <app-avatar-group
                [avatars]="getMemberAvatars()"
                [max]="3"
                size="sm"
              ></app-avatar-group>
              }

              <!-- Quick Actions -->
              <app-button
                variant="outline"
                size="sm"
                [routerLink]="['/boards', board()!.id, 'members']"
              >
                <lucide-icon
                  [img]="Users"
                  [size]="16"
                  class="mr-2"
                ></lucide-icon>
                {{ i18n.t('boards.detail.members') }}
              </app-button>

              @if (canManageBoard()) {
              <app-button
                variant="outline"
                size="sm"
                [routerLink]="['/boards', board()!.id, 'settings']"
              >
                <lucide-icon
                  [img]="Settings"
                  [size]="16"
                  class="mr-2"
                ></lucide-icon>
                {{ i18n.t('common.settings') }}
              </app-button>
              }

              <!-- More Actions -->
              <app-dropdown-menu
                [items]="getMenuItems()"
                [trigger]="'click'"
                [placement]="'bottom-end'"
              >
                <button
                  class="p-2 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-default transition-colors"
                  [attr.aria-label]="i18n.t('common.more')"
                >
                  <lucide-icon [img]="MoreVertical" [size]="16"></lucide-icon>
                </button>
              </app-dropdown-menu>
            </div>
          </div>
        </div>
      </div>

      <!-- Board Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Filters and Search -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <!-- Search -->
            <div class="relative">
              <lucide-icon
                [img]="Search"
                [size]="16"
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
              ></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearchChange()"
                [placeholder]="i18n.t('boards.detail.searchTasks')"
                class="pl-10 pr-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
              />
            </div>

            <!-- Filter Button -->
            <app-button
              variant="outline"
              size="sm"
              (click)="toggleFilters()"
              [class.bg-primary-50]="showFilters()"
            >
              <lucide-icon
                [img]="Filter"
                [size]="16"
                class="mr-2"
              ></lucide-icon>
              {{ i18n.t('common.filters') }}
              @if (activeFiltersCount() > 0) {
              <app-badge variant="primary" size="sm" class="ml-2">
                {{ activeFiltersCount() }}
              </app-badge>
              }
            </app-button>
          </div>

          <!-- Add Task Button -->
          @if (canCreateTasks()) {
          <app-button (click)="createTask()">
            <lucide-icon [img]="Plus" [size]="16" class="mr-2"></lucide-icon>
            {{ i18n.t('boards.detail.addTask') }}
          </app-button>
          }
        </div>

        <!-- Kanban Board -->
        <div class="flex space-x-6 overflow-x-auto pb-6">
          @for (category of categories(); track category.id) {
          <div class="flex-shrink-0 w-80">
            <!-- Column Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full"
                  [style.background-color]="category.color"
                ></div>
                <h3 class="font-medium text-text-default">
                  {{ category.name }}
                </h3>
                <app-badge variant="secondary" size="sm">
                  {{ getTasksForCategory(category.id).length }}
                </app-badge>
              </div>

              @if (canCreateTasks()) {
              <button
                (click)="createTaskInCategory(category)"
                class="p-1 rounded hover:bg-surface-muted text-text-muted hover:text-text-default transition-colors"
                [attr.aria-label]="
                  i18n.t('boards.detail.addTaskToColumn', {
                    column: category.name
                  })
                "
              >
                <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
              </button>
              }
            </div>

            <!-- Tasks -->
            <div class="space-y-3 min-h-32">
              @for (task of getTasksForCategory(category.id); track task.id) {
              <div
                class="bg-surface border border-border-default rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                (click)="openTask(task)"
              >
                <!-- Task Header -->
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-medium text-text-default line-clamp-2">
                    {{ task.title }}
                  </h4>

                  @if (task.priority) {
                  <app-badge
                    [variant]="getPriorityVariant(task.priority)"
                    size="sm"
                  >
                    {{
                      i18n.t('tasks.priority.' + task.priority.toLowerCase())
                    }}
                  </app-badge>
                  }
                </div>

                @if (task.description) {
                <p class="text-sm text-text-muted mb-3 line-clamp-2">
                  {{ task.description }}
                </p>
                }

                <!-- Task Footer -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    @if (task.dueDate) {
                    <div
                      class="flex items-center space-x-1 text-xs text-text-muted"
                    >
                      <lucide-icon [img]="Calendar" [size]="12"></lucide-icon>
                      <span>{{ formatDate(task.dueDate) }}</span>
                    </div>
                    }
                  </div>

                  @if (task.assignees && task.assignees.length > 0) {
                  <app-avatar-group
                    [avatars]="getTaskAssigneeAvatars(task.assignees)"
                    [max]="2"
                    size="xs"
                  ></app-avatar-group>
                  }
                </div>
              </div>
              } @empty {
              <div class="text-center py-8">
                <p class="text-sm text-text-muted">
                  {{ i18n.t('boards.detail.noTasks') }}
                </p>
                @if (canCreateTasks()) {
                <app-button
                  variant="outline"
                  size="sm"
                  class="mt-2"
                  (click)="createTaskInCategory(category)"
                >
                  {{ i18n.t('boards.detail.addFirstTask') }}
                </app-button>
                }
              </div>
              }
            </div>
          </div>
          } @empty {
          <app-empty-state
            [icon]="'Archive'"
            [title]="i18n.t('boards.detail.noCategories')"
            [description]="i18n.t('boards.detail.noCategoriesDescription')"
          >
            @if (canManageBoard()) {
            <app-button [routerLink]="['/boards', board()!.id, 'settings']">
              {{ i18n.t('boards.detail.setupCategories') }}
            </app-button>
            }
          </app-empty-state>
          }
        </div>
      </div>
      }
    </div>
  `,
})
export class BoardDetailComponent implements OnInit {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Settings = Settings;
  readonly Users = Users;
  readonly Star = Star;
  readonly StarOff = StarOff;
  readonly MoreVertical = MoreVertical;
  readonly Plus = Plus;
  readonly Filter = Filter;
  readonly Search = Search;
  readonly Calendar = Calendar;
  readonly Archive = Archive;
  readonly Eye = Eye;
  readonly Lock = Lock;
  readonly Globe = Globe;
  readonly AlertCircle = AlertCircle;

  // Services
  i18n = inject(TranslationService);
  boardService = inject(BoardService);
  taskService = inject(TaskService);
  categoryService = inject(CategoryService);
  toastService = inject(ToastService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // Component State
  board = signal<Board | null>(null);
  tasks = signal<Task[]>([]);
  categories = signal<Category[]>([]);
  boardMembers = signal<BoardMember[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  showFilters = signal(false);
  starredBoards = signal<Set<string>>(new Set());

  // Computed Properties
  activeFiltersCount = computed(() => {
    // Calculate active filters count
    return 0; // Placeholder
  });

  isStarred = computed(() => {
    return this.board() ? this.starredBoards().has(this.board()!.id) : false;
  });

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const boardId = params['id'];
      if (boardId) {
        this.loadBoard(boardId);
      }
    });

    this.loadStarredBoards();
  }

  async loadBoard(boardId?: string) {
    if (!boardId && !this.board()) return;

    const id = boardId || this.board()!.id;
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const [board, tasks, categories, members] = await Promise.all([
        this.boardService.getBoardById(id),
        this.taskService.getBoardTasks(id),
        this.categoryService.getBoardCategories(id),
        this.boardService.getBoardMembers(id),
      ]);

      this.board.set(board);
      this.tasks.set(tasks.list);
      this.categories.set(categories.categories);
      this.boardMembers.set(members);
    } catch (error) {
      console.error('Failed to load board:', error);
      this.error.set(this.i18n.t('boards.detail.loadError'));
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/boards']);
  }

  toggleStar() {
    if (!this.board()) return;

    const starred = new Set(this.starredBoards());
    const boardId = this.board()!.id;

    if (starred.has(boardId)) {
      starred.delete(boardId);
    } else {
      starred.add(boardId);
    }

    this.starredBoards.set(starred);
    this.saveStarredBoards();
  }

  canManageBoard(): boolean {
    const board = this.board();
    return board ? ['OWNER', 'ADMIN'].includes(board.userRole) : false;
  }

  canCreateTasks(): boolean {
    const board = this.board();
    return board
      ? ['OWNER', 'ADMIN', 'MEMBER'].includes(board.userRole)
      : false;
  }

  getTasksForCategory(categoryId: string): Task[] {
    return this.tasks().filter((task) => task.categoryId === categoryId);
  }

  getPriorityVariant(
    priority: string
  ): 'success' | 'warning' | 'danger' | 'primary' {
    switch (priority) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'danger';
      case 'CRITICAL':
        return 'danger';
      default:
        return 'primary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  onSearchChange() {
    // Implement search functionality
  }

  toggleFilters() {
    this.showFilters.update((show) => !show);
  }

  createTask() {
    // Implement task creation
  }

  createTaskInCategory(category: Category) {
    // Implement task creation in specific category
  }

  openTask(task: Task) {
    // Navigate to task detail or open modal
  }

  getMenuItems(): DropdownMenuItem[] {
    const items: DropdownMenuItem[] = [];

    if (this.canManageBoard()) {
      items.push({
        id: 'duplicate',
        label: this.i18n.t('common.duplicate'),
        action: () => this.duplicateBoard(),
      });

      items.push({
        id: 'divider-1',
        type: 'divider',
        label: '',
        action: () => {},
      });

      if (this.board()?.status === 'ACTIVE') {
        items.push({
          id: 'archive',
          label: this.i18n.t('common.archive'),
          action: () => this.archiveBoard(),
        });
      }
    }

    return items;
  }

  duplicateBoard() {
    // Implement board duplication
  }

  archiveBoard() {
    // Implement board archiving
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

  // Helper methods for avatar data conversion
  getMemberAvatars(): AvatarData[] {
    return this.boardMembers()
      .slice(0, 3)
      .map((member) => ({
        id: member.id,
        name: member.user.fullName,
        src: member.user.avatarUrl,
        email: member.user.email,
      }));
  }

  getTaskAssigneeAvatars(assignees: User[]): AvatarData[] {
    return assignees.map((user) => ({
      id: user.id,
      name: user.fullName,
      src: user.avatarUrl,
      email: user.email,
    }));
  }
}
