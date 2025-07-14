import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  RefreshCw,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  BarChart3,
  Activity,
  ChevronRight,
  Settings,
} from 'lucide-angular';

// Store and Services
import { AuthStore } from '@store/auth.store';
import { DashboardStore } from '@store/dashboard.store';
import { TranslationService } from '@core/services';

import { WelcomeHeaderComponent } from '@features/dashboard/components/welcome-header/welcome-header.component';
import { QuickActionsComponent } from '@features/dashboard/components/quick-actions/quick-actions.component';
import { TasksOverviewComponent } from '@features/dashboard/components/tasks-overview/tasks-overview.component';
import { DashboardStatsComponent } from '@features/dashboard/components/dashboard-stats/dashboard-stats.component';
import { RecentBoardsComponent } from '@features/dashboard/components/recent-boards/recent-boards.component';
import { ActivityFeedComponent } from '@features/dashboard/components/activity-feed/activity-feed.component';


/**
 * DashboardComponent serves as the main dashboard page
 * Provides overview of user's tasks, boards, and recent activity
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    // Child Components
    DashboardStatsComponent,
    RecentBoardsComponent,
    TasksOverviewComponent,
    ActivityFeedComponent,
    QuickActionsComponent,
    WelcomeHeaderComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Lucide icons
  readonly RefreshCw = RefreshCw;
  readonly Plus = Plus;
  readonly TrendingUp = TrendingUp;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly BarChart3 = BarChart3;
  readonly Activity = Activity;
  readonly ChevronRight = ChevronRight;
  readonly Settings = Settings;

  // Injected services
  readonly authStore = inject(AuthStore);
  readonly dashboardStore = inject(DashboardStore);
  readonly i18n = inject(TranslationService);

  // Auto-refresh interval
  private refreshInterval?: number;

  async ngOnInit(): Promise<void> {
    // Load dashboard data
    await this.dashboardStore.loadDashboard();

    // Set up auto-refresh every 5 minutes
    this.refreshInterval = window.setInterval(() => {
      this.dashboardStore.refreshDashboard();
    }, 5 * 60 * 1000);
  }

  ngOnDestroy(): void {
    // Clean up auto-refresh
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async onRefresh(): Promise<void> {
    await this.dashboardStore.refreshDashboard();
  }

  async onPeriodChange(period: 'week' | 'month' | 'quarter'): Promise<void> {
    await this.dashboardStore.setPeriod(period);
  }

  onToggleCompletedTasks(): void {
    this.dashboardStore.toggleCompletedTasks();
  }

  async onTaskComplete(event: {
    taskId: string;
    completed: boolean;
  }): Promise<void> {
    await this.dashboardStore.updateTaskCompletion(
      event.taskId,
      event.completed
    );
  }

  async onMarkActivityAsRead(activityIds: string[]): Promise<void> {
    await this.dashboardStore.markActivityAsRead(activityIds);
  }

  async onMarkAllActivityAsRead(): Promise<void> {
    await this.dashboardStore.markAllActivityAsRead();
  }
}
