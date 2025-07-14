import { Injectable, inject } from '@angular/core';
import { Board, Task } from '@core/models';
import { HttpClientService } from '@core/services/http-client.service';
import { ActivityItem, DashboardStats, QuickAction } from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private httpClient = inject(HttpClientService);

  /**
   * Gets dashboard-wide statistics (stub implementation)
   * @param query - Optional query parameters for filtering (e.g., period)
   * @returns Promise with mock dashboard statistics
   */
  async getDashboardStats(query?: {
    period?: string;
  }): Promise<DashboardStats> {
    // TODO: Replace with real API call when backend endpoint is available
    return Promise.resolve({
      totalTasks: 42,
      completedTasks: 30,
      overdueTasks: 5,
      tasksDueToday: 7,
      totalBoards: 4,
      activeBoards: 3,
      completionRate: 71,
      weeklyProgress: [
        { date: '2024-06-01', completed: 3, created: 4, label: 'Mon' },
        { date: '2024-06-02', completed: 5, created: 6, label: 'Tue' },
        { date: '2024-06-03', completed: 2, created: 3, label: 'Wed' },
        { date: '2024-06-04', completed: 4, created: 5, label: 'Thu' },
        { date: '2024-06-05', completed: 6, created: 7, label: 'Fri' },
        { date: '2024-06-06', completed: 7, created: 8, label: 'Sat' },
        { date: '2024-06-07', completed: 3, created: 2, label: 'Sun' },
      ],
    });
  }

  /**
   * Gets recent boards for the current user
   * @param limit - Number of boards to retrieve (default: 6)
   * @returns Promise with recent boards array
   */
  async getRecentBoards(limit = 6): Promise<Board[]> {
    try {
      const response = await this.httpClient.getPaginated<Board>(
        '/api/v1/boards',
        {
          status: 'ACTIVE',
          limit,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }
      );
      return response.list;
    } catch (error) {
      console.error('Failed to get recent boards:', error);
      throw error;
    }
  }

  /**
   * Gets user's tasks for dashboard overview
   * @param filters - Task filters (status, due date, etc.)
   * @returns Promise with tasks array
   */
  async getDashboardTasks(filters?: {
    status?: string;
    dueToday?: boolean;
    overdue?: boolean;
    limit?: number;
  }): Promise<Task[]> {
    try {
      const response = await this.httpClient.getPaginated<Task>(
        '/api/v1/my/tasks',
        {
          ...filters,
          sortBy: 'dueDate',
          sortOrder: 'asc',
        }
      );
      return response.list;
    } catch (error) {
      console.error('Failed to get dashboard tasks:', error);
      throw error;
    }
  }

  /**
   * Gets recent activity feed for the user
   * @param limit - Number of activities to retrieve (default: 10)
   * @returns Promise with activity items array
   */
  async getRecentActivity(limit = 10): Promise<ActivityItem[]> {
    try {
      const response = await this.httpClient.getPaginated<ActivityItem>(
        '/api/v1/dashboard/activity',
        {
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }
      );
      return response.list;
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      // Return empty array as fallback for non-critical feature
      return [];
    }
  }

  /**
   * Gets available quick actions for the dashboard
   * @returns Array of quick action items
   */
  getQuickActions(): QuickAction[] {
    return [
      {
        id: 'create-board',
        title: 'Create Board',
        description: 'Start a new project board',
        icon: 'Plus',
        route: '/boards/new',
        color: 'primary',
        enabled: true,
      },
      {
        id: 'join-board',
        title: 'Join Board',
        description: 'Join an existing board with invitation',
        icon: 'UserPlus',
        route: '/boards/join',
        color: 'secondary',
        enabled: true,
      },
      {
        id: 'view-tasks',
        title: 'My Tasks',
        description: 'View all your assigned tasks',
        icon: 'CheckSquare',
        route: '/tasks',
        color: 'accent',
        enabled: true,
      },
      {
        id: 'calendar',
        title: 'Calendar',
        description: 'View tasks in calendar format',
        icon: 'Calendar',
        route: '/calendar',
        color: 'warning',
        enabled: false, // Not implemented yet
      },
    ];
  }

  /**
   * Marks activity items as read
   * @param activityIds - Array of activity IDs to mark as read
   */
  async markActivityAsRead(activityIds: string[]): Promise<void> {
    try {
      await this.httpClient.post('/api/v1/dashboard/activity/read', {
        activityIds,
      });
    } catch (error) {
      console.error('Failed to mark activity as read:', error);
      // Don't throw error for non-critical feature
    }
  }

  /**
   * Gets task completion trend data for charts
   * @param days - Number of days to retrieve data for (default: 7)
   * @returns Promise with weekly progress data
   */
  async getTaskTrends(days = 7): Promise<any[]> {
    try {
      return await this.httpClient.get<any[]>('/api/v1/dashboard/trends', {
        days,
      });
    } catch (error) {
      console.error('Failed to get task trends:', error);
      // Return mock data for demo purposes
      return this.getMockTrendData(days);
    }
  }

  /**
   * Provides mock trend data for demo/fallback purposes
   * @param days - Number of days to generate data for
   * @returns Mock trend data array
   */
  private getMockTrendData(days: number): any[] {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        completed: Math.floor(Math.random() * 10) + 1,
        created: Math.floor(Math.random() * 8) + 2,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return data;
  }

  /**
   * Validates dashboard data and provides fallbacks
   * @param stats - Dashboard stats to validate
   * @returns Validated stats with fallbacks
   */
  validateStats(stats: Partial<DashboardStats>): DashboardStats {
    return {
      totalTasks: stats.totalTasks ?? 0,
      completedTasks: stats.completedTasks ?? 0,
      overdueTasks: stats.overdueTasks ?? 0,
      tasksDueToday: stats.tasksDueToday ?? 0,
      totalBoards: stats.totalBoards ?? 0,
      activeBoards: stats.activeBoards ?? 0,
      completionRate: stats.completionRate ?? 0,
      weeklyProgress: stats.weeklyProgress ?? [],
    };
  }
}
