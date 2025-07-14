import { inject, computed } from '@angular/core';
import {
  withState,
  patchState,
  signalStore,
  withMethods,
  withComputed,
} from '@ngrx/signals';
import {
  TaskStatus,
  QuickAction,
  ActivityItem,
  DashboardStats,
} from '@core/types';
import { Board, Task } from '@core/models';
import {
  ToastService,
  DashboardService,
  TranslationService,
} from '@core/services';

interface DashboardState {
  stats: DashboardStats | null;
  recentBoards: Board[];
  tasksDueToday: Task[];
  overdueTasks: Task[];
  recentActivity: ActivityItem[];
  quickActions: QuickAction[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  selectedPeriod: 'week' | 'month' | 'quarter';
  showCompletedTasks: boolean;
}

const initialState: DashboardState = {
  stats: null,
  recentBoards: [],
  tasksDueToday: [],
  overdueTasks: [],
  recentActivity: [],
  quickActions: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  selectedPeriod: 'week',
  showCompletedTasks: false,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(
    ({
      stats,
      recentBoards,
      tasksDueToday,
      overdueTasks,
      recentActivity,
      quickActions,
      error,
      isLoading,
    }) => ({
      hasData: computed(() => !!stats() || recentBoards().length > 0),
      isInitialLoading: computed(() => isLoading() && !stats()),
      hasError: computed(() => !!error()),
      taskCompletionRate: computed(() => {
        const s = stats();
        if (!s || s.totalTasks === 0) return 0;
        return Math.round((s.completedTasks / s.totalTasks) * 100);
      }),
      urgentTasks: computed(() => {
        return [...overdueTasks(), ...tasksDueToday()];
      }),
      unreadActivityCount: computed(() => {
        return recentActivity().filter((item) => !item.isRead).length;
      }),
      availableQuickActions: computed(() => {
        return quickActions().filter((action) => action.enabled);
      }),
      recentBoardsSummary: computed(() => {
        const boards = recentBoards();
        return {
          total: boards.length,
          active: boards.filter((b) => b.status === 'ACTIVE').length,
          hasMore: boards.length >= 6, // Based on default limit
        };
      }),
      weeklyTrend: computed(() => {
        const s = stats();
        return s?.weeklyProgress || [];
      }),
      dashboardSummary: computed(() => {
        const s = stats();
        if (!s) return null;

        return {
          productivity:
            s.completionRate >= 80
              ? 'high'
              : s.completionRate >= 60
              ? 'medium'
              : 'low',
          workload:
            s.overdueTasks > 5
              ? 'heavy'
              : s.overdueTasks > 2
              ? 'moderate'
              : 'light',
          engagement: recentActivity().length > 10 ? 'high' : 'medium',
        };
      }),
    })
  ),
  withMethods(
    (
      store,
      dashboardService = inject(DashboardService),
      toastService = inject(ToastService),
      i18n = inject(TranslationService)
    ) => ({
      /**
       * Loads all dashboard data
       * @param forceRefresh - Whether to force refresh cached data
       */
      async loadDashboard(forceRefresh = false) {
        const isRefresh = !!store.stats() && forceRefresh;

        patchState(store, {
          isLoading: !isRefresh,
          isRefreshing: isRefresh,
          error: null,
        });

        try {
          // Load all dashboard data in parallel
          const [
            stats,
            recentBoards,
            tasksDueToday,
            overdueTasks,
            recentActivity,
          ] = await Promise.allSettled([
            dashboardService.getDashboardStats({
              period: store.selectedPeriod(),
            }),
            dashboardService.getRecentBoards(6),
            dashboardService.getDashboardTasks({ dueToday: true, limit: 10 }),
            dashboardService.getDashboardTasks({ overdue: true, limit: 10 }),
            dashboardService.getRecentActivity(15),
          ]);

          // Process results and handle partial failures gracefully
          const dashboardData = {
            stats:
              stats.status === 'fulfilled'
                ? dashboardService.validateStats(stats.value)
                : null,
            recentBoards:
              recentBoards.status === 'fulfilled' ? recentBoards.value : [],
            tasksDueToday:
              tasksDueToday.status === 'fulfilled' ? tasksDueToday.value : [],
            overdueTasks:
              overdueTasks.status === 'fulfilled' ? overdueTasks.value : [],
            recentActivity:
              recentActivity.status === 'fulfilled' ? recentActivity.value : [],
            quickActions: dashboardService.getQuickActions(),
            lastUpdated: new Date(),
          };

          patchState(store, {
            ...dashboardData,
            isLoading: false,
            isRefreshing: false,
            error: null,
          });

          // Show success message only for manual refresh
          if (isRefresh) {
            toastService.success(
              i18n.translate('dashboard.refreshSuccess') || 'Dashboard updated'
            );
          }

          // Log any partial failures
          [
            stats,
            recentBoards,
            tasksDueToday,
            overdueTasks,
            recentActivity,
          ].forEach((result, index) => {
            if (result.status === 'rejected') {
              const endpoints = [
                'stats',
                'boards',
                'due tasks',
                'overdue tasks',
                'activity',
              ];
              console.warn(
                `Failed to load dashboard ${endpoints[index]}:`,
                result.reason
              );
            }
          });
        } catch (error: any) {
          const errorMessage =
            error.message || i18n.translate('dashboard.loadError');

          patchState(store, {
            isLoading: false,
            isRefreshing: false,
            error: errorMessage,
          });

          toastService.error(i18n.translate('common.error'), errorMessage);

          console.error('Dashboard load failed:', error);
        }
      },

      /**
       * Refreshes dashboard data
       */
      async refreshDashboard() {
        await this.loadDashboard(true);
      },

      /**
       * Changes the selected time period and reloads stats
       * @param period - Time period to set
       */
      async setPeriod(period: 'week' | 'month' | 'quarter') {
        if (period === store.selectedPeriod()) return;

        patchState(store, { selectedPeriod: period });

        try {
          const stats = await dashboardService.getDashboardStats({ period });
          patchState(store, {
            stats: dashboardService.validateStats(stats),
          });
        } catch (error) {
          console.error('Failed to update dashboard period:', error);
        }
      },

      toggleCompletedTasks() {
        patchState(store, {
          showCompletedTasks: !store.showCompletedTasks(),
        });
      },

      /**
       * Marks activity items as read
       * @param activityIds - Array of activity IDs to mark as read
       */
      async markActivityAsRead(activityIds: string[]) {
        try {
          await dashboardService.markActivityAsRead(activityIds);

          // Update local state
          patchState(store, {
            recentActivity: store
              .recentActivity()
              .map((item) =>
                activityIds.includes(item.id) ? { ...item, isRead: true } : item
              ),
          });
        } catch (error) {
          console.error('Failed to mark activity as read:', error);
        }
      },

      /**
       * Marks all activity as read
       */
      async markAllActivityAsRead() {
        const unreadIds = store
          .recentActivity()
          .filter((item) => !item.isRead)
          .map((item) => item.id);

        if (unreadIds.length > 0) {
          await this.markActivityAsRead(unreadIds);
        }
      },

      /**
       * Adds a new activity item (for real-time updates)
       * @param activity - Activity item to add
       */
      addActivity(activity: ActivityItem) {
        patchState(store, {
          recentActivity: [activity, ...store.recentActivity().slice(0, 14)],
        });
      },

      /**
       * Updates a board in the recent boards list
       * @param updatedBoard - Updated board data
       */
      updateRecentBoard(updatedBoard: Board) {
        patchState(store, {
          recentBoards: store
            .recentBoards()
            .map((board) =>
              board.id === updatedBoard.id ? updatedBoard : board
            ),
        });
      },

      /**
       * Removes a board from recent boards list
       * @param boardId - ID of board to remove
       */
      removeRecentBoard(boardId: string) {
        patchState(store, {
          recentBoards: store
            .recentBoards()
            .filter((board) => board.id !== boardId),
        });
      },

      /**
       * Updates task completion status and refreshes stats
       * @param taskId - ID of completed task
       */
      async updateTaskCompletion(taskId: string, completed: boolean) {
        // Optimistically update local state
        const updateTaskInList = (tasks: Task[]) =>
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: completed ? 'COMPLETED' : 'TODO' }
              : task
          );

        patchState(store, {
          tasksDueToday: updateTaskInList(store.tasksDueToday()).map(
            (task) => ({
              ...task,
              status: task.status as TaskStatus,
            })
          ),
          overdueTasks: updateTaskInList(store.overdueTasks()).map((task) => ({
            ...task,
            status: task.status as TaskStatus,
          })),
        });

        // Update stats optimistically
        const currentStats = store.stats();
        if (currentStats) {
          const statsDelta = completed ? 1 : -1;
          patchState(store, {
            stats: {
              ...currentStats,
              completedTasks: Math.max(
                0,
                currentStats.completedTasks + statsDelta
              ),
              completionRate: Math.min(
                100,
                Math.max(
                  0,
                  ((currentStats.completedTasks + statsDelta) /
                    currentStats.totalTasks) *
                    100
                )
              ),
            },
          });
        }
      },

      /**
       * Clears any error state
       */
      clearError() {
        patchState(store, { error: null });
      },

      /**
       * Resets dashboard state to initial state
       */
      reset() {
        patchState(store, initialState);
      },

      /**
       * Gets fresh task trends data
       * @param days - Number of days to get trends for
       */
      async loadTaskTrends(days = 7) {
        try {
          const trends = await dashboardService.getTaskTrends(days);

          // Update stats with trend data if available
          const currentStats = store.stats();
          if (currentStats) {
            patchState(store, {
              stats: {
                ...currentStats,
                weeklyProgress: trends,
              },
            });
          }

          return trends;
        } catch (error) {
          console.error('Failed to load task trends:', error);
          return [];
        }
      },
    })
  )
);
