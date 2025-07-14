// Location: src/app/features/boards/pages/board-list/board-list.component.ts

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Archive,
  LoaderIcon,
  MoreVertical,
  Star,
  Users,
  Calendar,
  Settings,
} from 'lucide-angular';

import { BoardsStore } from '@store/boards.store';
import { TranslationService } from '@core/services';
import { Board } from '@core/models';
import { BoardCardComponent } from '../../components/board-card/board-card';
import { BoardFiltersComponent } from '../../components/board-filters/board-filters.component';
import { CreateBoardModalComponent } from '../../components/create-board-modal/create-board-modal';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state';
import { BoardQuery } from '@core/types';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    BoardCardComponent,
    BoardFiltersComponent,
    CreateBoardModalComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-background">
      <!-- Page Header -->
      <header
        class="bg-surface border-b border-border-default sticky top-16 z-30"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Title and Stats -->
            <div class="flex items-center space-x-4">
              <div>
                <h1 class="text-2xl font-bold text-text-default">
                  {{ i18n.t('boards.title') }}
                </h1>
                <p class="text-sm text-text-muted mt-1">
                  {{
                    i18n.t('boards.subtitle', {
                      total: boardsStore.totalBoards(),
                      active: boardsStore.activeBoards()
                    })
                  }}
                </p>
              </div>

              <!-- Quick Stats -->
              <div
                class="hidden md:flex items-center space-x-6 pl-6 border-l border-border-default"
              >
                <div class="text-center">
                  <div class="text-lg font-semibold text-text-default">
                    {{ boardsStore.activeBoards() }}
                  </div>
                  <div class="text-xs text-text-muted">
                    {{ i18n.t('boards.active') }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-semibold text-text-default">
                    {{ boardsStore.archivedBoards() }}
                  </div>
                  <div class="text-xs text-text-muted">
                    {{ i18n.t('boards.archived') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-3">
              <!-- Search Input -->
              <div class="relative hidden sm:block">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <lucide-icon
                    [img]="Search"
                    [size]="16"
                    class="text-text-muted"
                  ></lucide-icon>
                </div>
                <input
                  type="search"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchChange($event)"
                  [placeholder]="i18n.t('boards.searchPlaceholder')"
                  class="input-default pl-9 w-64"
                />
              </div>

              <!-- View Toggle -->
              <div
                class="flex items-center border border-border-default rounded-lg p-1"
              >
                <button
                  (click)="setViewMode('grid')"
                  [class]="
                    viewMode() === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'text-text-muted hover:text-text-default'
                  "
                  class="p-1.5 rounded transition-colors"
                  [attr.aria-label]="i18n.t('boards.gridView')"
                >
                  <lucide-icon [img]="Grid" [size]="16"></lucide-icon>
                </button>
                <button
                  (click)="setViewMode('list')"
                  [class]="
                    viewMode() === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'text-text-muted hover:text-text-default'
                  "
                  class="p-1.5 rounded transition-colors"
                  [attr.aria-label]="i18n.t('boards.listView')"
                >
                  <lucide-icon [img]="List" [size]="16"></lucide-icon>
                </button>
              </div>

              <!-- Filters Toggle -->
              <button
                (click)="toggleFilters()"
                [class]="
                  showFilters()
                    ? 'bg-primary-50 text-primary-600 border-primary-200'
                    : 'border-border-default text-text-default'
                "
                class="flex items-center px-3 py-2 border rounded-lg hover:bg-surface-muted transition-colors"
              >
                <lucide-icon
                  [img]="Filter"
                  [size]="16"
                  class="mr-2"
                ></lucide-icon>
                <span class="hidden sm:block">{{
                  i18n.t('common.filters')
                }}</span>
              </button>

              <!-- Create Board Button -->
              <button (click)="openCreateModal()" class="btn-primary btn-md">
                <lucide-icon
                  [img]="Plus"
                  [size]="16"
                  class="mr-2"
                ></lucide-icon>
                <span class="hidden sm:block">{{
                  i18n.t('boards.createBoard')
                }}</span>
                <span class="sm:hidden">{{ i18n.t('common.create') }}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Search -->
      <div
        class="sm:hidden bg-surface border-b border-border-default px-4 py-3"
      >
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <lucide-icon
              [img]="Search"
              [size]="16"
              class="text-text-muted"
            ></lucide-icon>
          </div>
          <input
            type="search"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            [placeholder]="i18n.t('boards.searchPlaceholder')"
            class="input-default pl-9 w-full"
          />
        </div>
      </div>

      <!-- Filters Panel -->
      @if (showFilters()) {
      <app-board-filters
        [filters]="currentFilters()"
        (filtersChange)="onFiltersChange($event)"
        (clearFilters)="clearAllFilters()"
      ></app-board-filters>
      }

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Loading State -->
        @if (boardsStore.isLoading() && !boardsStore.hasBoards()) {
        <div class="flex justify-center items-center h-64">
          <app-loading-spinner
            [size]="'lg'"
            [message]="i18n.t('boards.loading')"
          ></app-loading-spinner>
        </div>
        }

        <!-- Error State -->
        @else if (boardsStore.hasError()) {
        <div
          class="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center"
        >
          <p class="text-danger-700 mb-4">{{ boardsStore.error() }}</p>
          <button (click)="retryLoading()" class="btn-primary btn-sm">
            {{ i18n.t('common.retry') }}
          </button>
        </div>
        }

        <!-- Empty State -->
        @else if (!boardsStore.isLoading() && filteredBoards().length === 0) {
        @if (boardsStore.totalBoards() === 0) {
        <!-- No boards at all -->
        <app-empty-state
          [icon]="'Folder'"
          [title]="i18n.t('boards.empty.title')"
          [description]="i18n.t('boards.empty.description')"
          [actionText]="i18n.t('boards.createFirst')"
          (action)="openCreateModal()"
        ></app-empty-state>
        } @else {
        <!-- No results for current filters -->
        <app-empty-state
          [icon]="'Search'"
          [title]="i18n.t('boards.noResults.title')"
          [description]="i18n.t('boards.noResults.description')"
          [actionText]="i18n.t('common.clearFilters')"
          (action)="clearAllFilters()"
        ></app-empty-state>
        } }

        <!-- Boards Grid/List -->
        @else {
        <!-- Grid View -->
        @if (viewMode() === 'grid') {
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          @for (board of filteredBoards(); track board.id) {
          <app-board-card
            [board]="board"
            [viewMode]="'grid'"
            (boardClick)="navigateToBoard(board.id)"
            (menuAction)="handleBoardAction($event)"
          ></app-board-card>
          }
        </div>
        }

        <!-- List View -->
        @else {
        <div class="space-y-3">
          @for (board of filteredBoards(); track board.id) {
          <app-board-card
            [board]="board"
            [viewMode]="'list'"
            (boardClick)="navigateToBoard(board.id)"
            (menuAction)="handleBoardAction($event)"
          ></app-board-card>
          }
        </div>
        }

        <!-- Load More Button -->
        @if (boardsStore.canLoadMore()) {
        <div class="flex justify-center mt-8">
          <button
            (click)="loadMoreBoards()"
            [disabled]="boardsStore.isLoading()"
            class="btn-outline btn-md"
          >
            @if (boardsStore.isLoading()) {
            <lucide-icon
              [img]="LoaderIcon"
              [size]="16"
              class="mr-2 animate-spin"
            ></lucide-icon>
            }
            {{ i18n.t('common.loadMore') }}
          </button>
        </div>
        } }
      </main>

      <!-- Create Board Modal -->
      @if (showCreateModal()) {
      <app-create-board-modal
        [duplicateFromBoard]="boardCopy()"
        (boardCreated)="onBoardCreated($event)"
        (close)="closeCreateModal()"
      ></app-create-board-modal>
      }
    </div>
  `,
})
export class BoardListComponent implements OnInit {
  // Icons
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Grid = Grid;
  readonly List = List;
  readonly Archive = Archive;
  readonly MoreVertical = MoreVertical;
  readonly Star = Star;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly Settings = Settings;
  readonly LoaderIcon = LoaderIcon;

  // Store and Services
  boardsStore = inject(BoardsStore);
  i18n = inject(TranslationService);
  private router = inject(Router);

  // Component State
  searchQuery = signal('');
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);
  showCreateModal = signal(false);
  currentFilters = signal<BoardQuery>({});
  boardCopy = signal<Board | undefined>(undefined);

  // Computed Properties
  filteredBoards = computed(() => {
    const boards = this.boardsStore.filteredBoards();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return boards;

    return boards.filter(
      (board) =>
        board.title.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query)
    );
  });

  async ngOnInit() {
    // Load boards if not already loaded
    if (!this.boardsStore.hasBoards()) {
      await this.loadBoards();
    }

    // Restore view preferences from localStorage
    this.restoreViewPreferences();
  }

  private async loadBoards() {
    try {
      await this.boardsStore.loadBoards();
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  }

  private restoreViewPreferences() {
    try {
      const savedViewMode = localStorage.getItem('boardViewMode') as
        | 'grid'
        | 'list';
      if (savedViewMode) {
        this.viewMode.set(savedViewMode);
      }
    } catch (error) {
      console.warn('Failed to restore view preferences:', error);
    }
  }

  private saveViewPreferences() {
    try {
      localStorage.setItem('boardViewMode', this.viewMode());
    } catch (error) {
      console.warn('Failed to save view preferences:', error);
    }
  }

  // Search and Filter Methods
  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.boardsStore.setSearchQuery(query);
  }

  onFiltersChange(filters: BoardQuery) {
    this.currentFilters.set(filters);
    this.boardsStore.loadBoards(filters);
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.currentFilters.set({});
    this.boardsStore.clearFilters();
    this.boardsStore.loadBoards();
  }

  toggleFilters() {
    this.showFilters.update((show) => !show);
  }

  // View Methods
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
    this.saveViewPreferences();
  }

  // Board Actions
  navigateToBoard(boardId: string) {
    this.router.navigate(['/boards', boardId]);
  }

  handleBoardAction(action: { type: string; board: Board }) {
    switch (action.type) {
      case 'edit':
        this.editBoard(action.board);
        break;
      case 'archive':
        this.archiveBoard(action.board);
        break;
      case 'restore':
        this.restoreBoard(action.board);
        break;
      case 'delete':
        this.deleteBoard(action.board);
        break;
      case 'settings':
        this.openBoardSettings(action.board);
        break;
      case 'duplicate':
        this.duplicateBoard(action.board);
        break;
      case 'star':
        this.toggleBoardStar(action.board);
        break;
    }
  }

  private async editBoard(board: Board) {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit board:', board.id);
  }

  private async archiveBoard(board: Board) {
    if (confirm(this.i18n.t('boards.confirmArchive', { title: board.title }))) {
      await this.boardsStore.archiveBoard(board.id);
    }
  }

  private async restoreBoard(board: Board) {
    await this.boardsStore.restoreBoard(board.id);
  }

  private async deleteBoard(board: Board) {
    if (confirm(this.i18n.t('boards.confirmDelete', { title: board.title }))) {
      await this.boardsStore.deleteBoard(board.id);
    }
  }

  private openBoardSettings(board: Board) {
    // TODO: Navigate to board settings
    console.log('Open settings for board:', board.id);
  }

  private async duplicateBoard(board: Board) {
    this.boardCopy.set(board);
    this.showCreateModal.set(true);
  }

  private async toggleBoardStar(board: Board) {
    // TODO: Implement board starring/favoring
    console.log('Toggle star for board:', board.id);
  }

  // Modal Methods
  openCreateModal() {
    this.boardCopy.set(undefined);
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.boardCopy.set(undefined);
  }

  onBoardCreated(board: Board) {
    this.closeCreateModal();
    this.navigateToBoard(board.id);
  }

  // Pagination
  async loadMoreBoards() {
    try {
      await this.boardsStore.loadMoreBoards();
    } catch (error) {
      console.error('Failed to load more boards:', error);
    }
  }

  async retryLoading() {
    await this.loadBoards();
  }
}
