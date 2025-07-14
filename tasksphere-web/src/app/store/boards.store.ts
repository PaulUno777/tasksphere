import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Board, BoardMember, BoardStats } from '@core/models';
import {
  BoardQuery,
  CreateBoardRequest,
  UpdateBoardRequest,
  UpdateBoardSettingsRequest,
  InviteMemberRequest,
  InviteMultipleMembersRequest,
  UpdateMemberRoleRequest,
  BoardInvitation,
  PageMetadata,
} from '@core/types';
import { BoardService, ToastService, TranslationService } from '@core/services';

interface BoardsState {
  // Board listing state
  boards: Board[];
  currentBoard: Board | null;
  selectedBoards: string[];

  // Member management state
  boardMembers: BoardMember[];
  pendingInvitations: BoardInvitation[];

  // Statistics and metadata
  boardStats: BoardStats | null;
  pagination: PageMetadata | null;

  // Loading and error states
  isLoading: boolean;
  isSaving: boolean;
  isLoadingMembers: boolean;
  isInviting: boolean;
  error: string | null;

  // Filters and search
  filters: BoardQuery;
  searchQuery: string;
  selectedStatus: 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'ALL';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Initial state for the board store
 * Sets up default values for all state properties
 */
const initialState: BoardsState = {
  boards: [],
  currentBoard: null,
  selectedBoards: [],
  boardMembers: [],
  pendingInvitations: [],
  boardStats: null,
  pagination: null,
  isLoading: false,
  isSaving: false,
  isLoadingMembers: false,
  isInviting: false,
  error: null,
  filters: {},
  searchQuery: '',
  selectedStatus: 'ACTIVE',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

/**
 * Board Store
 * Comprehensive state management for all board-related functionality
 * Includes computed selectors and methods for CRUD operations
 */
export const BoardsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // Computed selectors for derived state
  withComputed(
    ({
      boards,
      currentBoard,
      boardMembers,
      searchQuery,
      selectedStatus,
      selectedBoards,
      boardStats,
      pagination,
      error,
    }) => ({
      // Board filtering and search
      filteredBoards: computed(() => {
        let filtered = boards();

        // Filter by status
        if (selectedStatus() !== 'ALL') {
          filtered = filtered.filter(
            (board) => board.status === selectedStatus()
          );
        }

        // Search filter
        const query = searchQuery().toLowerCase().trim();
        if (query) {
          filtered = filtered.filter(
            (board) =>
              board.title.toLowerCase().includes(query) ||
              board.description?.toLowerCase().includes(query)
          );
        }

        return filtered;
      }),

      // Board statistics
      totalBoards: computed(() => boards().length),
      activeBoards: computed(
        () => boards().filter((b) => b.status === 'ACTIVE').length
      ),
      archivedBoards: computed(
        () => boards().filter((b) => b.status === 'ARCHIVED').length
      ),

      // Current board info
      currentBoardTitle: computed(() => currentBoard()?.title || ''),
      currentBoardId: computed(() => currentBoard()?.id || ''),
      isCurrentBoardOwner: computed(() => currentBoard()?.userRole === 'OWNER'),
      isCurrentBoardAdmin: computed(
        () =>
          currentBoard()?.userRole === 'OWNER' ||
          currentBoard()?.userRole === 'ADMIN'
      ),
      canManageMembers: computed(() => {
        const board = currentBoard();
        currentBoard()?.userRole === 'OWNER' ||
          currentBoard()?.userRole === 'ADMIN' ||
          (board?.userRole === 'MEMBER' && board.settings.allowMemberInvite);
      }),
      canManageBoard: computed(() => {
        const board = currentBoard();
        return (
          board && (board.userRole === 'OWNER' || board.userRole === 'ADMIN')
        );
      }),
      canDeleteBoard: computed(() => currentBoard()?.userRole === 'OWNER'),

      // Member statistics
      totalMembers: computed(() => boardMembers().length),
      membersByRole: computed(() => {
        const members = boardMembers();
        return {
          owners: members.filter((m) => m.role === 'OWNER').length,
          admins: members.filter((m) => m.role === 'ADMIN').length,
          members: members.filter((m) => m.role === 'MEMBER').length,
          guests: members.filter((m) => m.role === 'GUEST').length,
        };
      }),

      // UI state
      hasError: computed(() => !!error()),
      hasBoards: computed(() => boards().length > 0),
      hasPagination: computed(() => !!pagination()),
      canLoadMore: computed(() => pagination()?.hasNext || false),
      hasSelectedBoards: computed(() => selectedBoards().length > 0),

      // Board stats
      boardStatsComputed: computed(() => {
        const stats = boardStats();
        if (!stats) return null;

        return {
          ...stats,
          completionPercentage:
            stats.totalTasks > 0
              ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
              : 0,
          memberGrowth:
            stats.activeMembers - stats.totalMembers + stats.activeMembers,
        };
      }),
    })
  ),
  // Methods for state mutations and API calls
  withMethods(
    (
      store,
      boardService = inject(BoardService),
      toastService = inject(ToastService),
      i18n = inject(TranslationService)
    ) => ({
      /**
       * Loads boards with optional query parameters
       * Supports pagination, filtering, and search
       */
      async loadBoards(query: BoardQuery = {}, append = false) {
        if (store.isLoading()) return;

        patchState(store, {
          isLoading: true,
          error: null,
          // Reset boards if not appending (pagination)
          ...(append ? {} : { boards: [] }),
        });

        try {
          // Merge current filters with new query
          const fullQuery = {
            ...store.filters(),
            ...query,
            status:
              store.selectedStatus() !== 'ALL'
                ? store.selectedStatus()
                : undefined,
            search: store.searchQuery() || undefined,
            sortBy: store.sortBy(),
            sortOrder: store.sortOrder(),
          };

          const response = await boardService.getBoards(fullQuery);

          patchState(store, {
            boards: append
              ? [...store.boards(), ...response.list]
              : response.list,
            pagination: response.metadata,
            isLoading: false,
            error: null,
            filters: fullQuery,
          });
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.loadError');

          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });

          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Loads more boards for pagination
       */
      async loadMoreBoards() {
        const pagination = store.pagination();
        if (!pagination?.hasNext) return;

        await this.loadBoards(
          {
            page: pagination.page + 1,
            limit: pagination.limit,
          },
          true
        );
      },

      /**
       * Sets the current board and loads its details
       */
      async selectBoard(boardId: string) {
        patchState(store, { isLoading: true, error: null });

        try {
          const board = await boardService.getBoardById(boardId);

          patchState(store, {
            currentBoard: board,
            isLoading: false,
            error: null,
          });

          // Load members and stats in parallel
          await Promise.all([
            this.loadBoardMembers(boardId),
            this.loadBoardStats(boardId),
          ]);
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.loadError');
          patchState(store, {
            currentBoard: null,
            isLoading: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
        }
      },

      /**
       * Creates a new board
       */
      async createBoard(boardData: CreateBoardRequest) {
        patchState(store, { isSaving: true, error: null });

        try {
          const newBoard = await boardService.createBoard(boardData);

          // Add to the beginning of the boards list
          patchState(store, {
            boards: [newBoard, ...store.boards()],
            currentBoard: newBoard,
            isSaving: false,
            error: null,
          });

          toastService.success(i18n.t('board.boardCreated'));
          return newBoard;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.createError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Updates an existing board
       */
      async updateBoard(boardId: string, boardData: UpdateBoardRequest) {
        patchState(store, { isSaving: true, error: null });

        try {
          const updatedBoard = await boardService.updateBoard(
            boardId,
            boardData
          );

          // Update in boards list
          const updatedBoards = store
            .boards()
            .map((board) => (board.id === boardId ? updatedBoard : board));

          patchState(store, {
            boards: updatedBoards,
            currentBoard:
              store.currentBoard()?.id === boardId
                ? updatedBoard
                : store.currentBoard(),
            isSaving: false,
            error: null,
          });

          toastService.success(i18n.t('board.boardUpdated'));
          return updatedBoard;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.updateError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Updates board settings
       */
      async updateBoardSettings(
        boardId: string,
        settings: UpdateBoardSettingsRequest
      ) {
        patchState(store, { isSaving: true, error: null });

        try {
          const updatedSettings = await boardService.updateBoardSettings(
            boardId,
            settings
          );

          // Update current board if it's the one being updated
          if (store.currentBoard()?.id === boardId) {
            patchState(store, {
              currentBoard: {
                ...store.currentBoard()!,
                settings: updatedSettings,
              },
            });
          }

          patchState(store, {
            isSaving: false,
            error: null,
          });

          toastService.success(i18n.t('board.settingsUpdated'));
          return updatedSettings;
        } catch (error: any) {
          const errorMessage =
            error.message || i18n.t('board.settingsUpdateError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Archives a board
       */
      async archiveBoard(boardId: string) {
        patchState(store, { isSaving: true, error: null });

        try {
          await boardService.archiveBoard(boardId);

          // Update board status in the list
          const updatedBoards = store
            .boards()
            .map((board) =>
              board.id === boardId
                ? { ...board, status: 'ARCHIVED' as const }
                : board
            );

          patchState(store, {
            boards: updatedBoards,
            isSaving: false,
            error: null,
          });
          toastService.success(i18n.t('board.boardArchived'));
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.archiveError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Restores an archived board
       */
      async restoreBoard(boardId: string) {
        patchState(store, { isSaving: true, error: null });

        try {
          await boardService.restoreBoard(boardId);

          // Update board status in the list
          const updatedBoards = store
            .boards()
            .map((board) =>
              board.id === boardId
                ? { ...board, status: 'ACTIVE' as const }
                : board
            );

          patchState(store, {
            boards: updatedBoards,
            isSaving: false,
            error: null,
          });
          toastService.success(i18n.t('board.boardRestored'));
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.restoreError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Permanently deletes a board
       */
      async deleteBoard(boardId: string) {
        patchState(store, { isSaving: true, error: null });

        try {
          await boardService.deleteBoard(boardId);

          // Remove from boards list
          const updatedBoards = store
            .boards()
            .filter((board) => board.id !== boardId);

          patchState(store, {
            boards: updatedBoards,
            currentBoard:
              store.currentBoard()?.id === boardId
                ? null
                : store.currentBoard(),
            isSaving: false,
            error: null,
          });
          toastService.success(i18n.t('board.boardDeleted'));
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.deleteError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Loads board members
       */
      async loadBoardMembers(boardId: string) {
        patchState(store, { isLoadingMembers: true, error: null });

        try {
          const members = await boardService.getBoardMembers(boardId);

          patchState(store, {
            boardMembers: members,
            isLoadingMembers: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.loadError');
          patchState(store, {
            isLoadingMembers: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
        }
      },

      /**
       * Invites a single member to the board
       */
      async inviteMember(boardId: string, inviteData: InviteMemberRequest) {
        patchState(store, { isInviting: true, error: null });

        try {
          const invitation = await boardService.inviteMember(
            boardId,
            inviteData
          );

          patchState(store, {
            isInviting: false,
            error: null,
          });

          // Reload members to get updated list
          await this.loadBoardMembers(boardId);

          toastService.success(i18n.t('board.invitationSent'));
          return invitation;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.inviteError');
          patchState(store, {
            isInviting: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Invites multiple members to the board
       */
      async inviteMultipleMembers(
        boardId: string,
        inviteData: InviteMultipleMembersRequest
      ) {
        patchState(store, { isInviting: true, error: null });

        try {
          const result = await boardService.inviteMultipleMembers(
            boardId,
            inviteData
          );

          patchState(store, {
            isInviting: false,
            error: null,
          });

          // Reload members to get updated list
          await this.loadBoardMembers(boardId);

          toastService.success(i18n.t('board.invitationSent'));
          return result;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.inviteError');
          patchState(store, {
            isInviting: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Updates a member's role
       */
      async updateMemberRole(
        boardId: string,
        memberId: string,
        roleData: UpdateMemberRoleRequest
      ) {
        patchState(store, { isSaving: true, error: null });

        try {
          const updatedMember = await boardService.updateMemberRole(
            boardId,
            memberId,
            roleData
          );

          // Update member in the list
          const updatedMembers = store
            .boardMembers()
            .map((member) => (member.id === memberId ? updatedMember : member));

          patchState(store, {
            boardMembers: updatedMembers,
            isSaving: false,
            error: null,
          });

          toastService.success(i18n.t('board.settingsUpdated'));
          return updatedMember;
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.updateError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Removes a member from the board
       */
      async removeMember(boardId: string, memberId: string) {
        patchState(store, { isSaving: true, error: null });

        try {
          await boardService.removeMember(boardId, memberId);

          // Remove member from the list
          const updatedMembers = store
            .boardMembers()
            .filter((member) => member.id !== memberId);

          patchState(store, {
            boardMembers: updatedMembers,
            isSaving: false,
            error: null,
          });
          toastService.success(i18n.t('board.memberRemoved'));
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.updateError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Leaves the current board
       */
      async leaveBoard(boardId: string) {
        patchState(store, { isSaving: true, error: null });

        try {
          await boardService.leaveBoard(boardId);

          // Remove board from the list and clear current board if it's the one we left
          const updatedBoards = store
            .boards()
            .filter((board) => board.id !== boardId);

          patchState(store, {
            boards: updatedBoards,
            currentBoard:
              store.currentBoard()?.id === boardId
                ? null
                : store.currentBoard(),
            isSaving: false,
            error: null,
          });
          toastService.success(i18n.t('board.leftBoard'));
        } catch (error: any) {
          const errorMessage = error.message || i18n.t('board.updateError');
          patchState(store, {
            isSaving: false,
            error: errorMessage,
          });
          toastService.error(i18n.t('common.error'), errorMessage);
          throw error;
        }
      },

      /**
       * Loads board statistics
       */
      async loadBoardStats(boardId: string) {
        try {
          const stats = await boardService.getBoardStats(boardId);

          patchState(store, {
            boardStats: stats,
          });
        } catch (error: any) {
          console.error('Failed to load board stats:', error);
          // Don't set error for stats as it's not critical
        }
      },

      // Filter and search methods
      setSearchQuery(query: string) {
        patchState(store, { searchQuery: query });
      },

      setStatusFilter(status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'ALL') {
        patchState(store, { selectedStatus: status });
      },

      setSorting(sortBy: string, sortOrder: 'asc' | 'desc') {
        patchState(store, { sortBy, sortOrder });
      },

      clearFilters() {
        patchState(store, {
          searchQuery: '',
          selectedStatus: 'ACTIVE',
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          filters: {},
        });
      },

      // Error handling
      clearError() {
        patchState(store, { error: null });
      },

      // Board selection for bulk operations
      toggleBoardSelection(boardId: string) {
        const selected = store.selectedBoards();
        const isSelected = selected.includes(boardId);

        patchState(store, {
          selectedBoards: isSelected
            ? selected.filter((id) => id !== boardId)
            : [...selected, boardId],
        });
      },

      selectAllBoards() {
        patchState(store, {
          selectedBoards: store.filteredBoards().map((board) => board.id),
        });
      },

      clearBoardSelection() {
        patchState(store, { selectedBoards: [] });
      },

      // Reset store state
      reset() {
        patchState(store, initialState);
      },
    })
  )
);
