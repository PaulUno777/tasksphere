import { Board, Task, User } from "@core/models";

export interface DashboardStats {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasksDueToday: number;
    totalBoards: number;
    activeBoards: number;
    completionRate: number;
    weeklyProgress: WeeklyProgress[];
  }
  

  export interface WeeklyProgress {
    date: string;
    completed: number;
    created: number;
  }
  

  export interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    user: User;
    board?: Board;
    task?: Task;
    createdAt: string;
    isRead: boolean;
  }
  
 
  export type ActivityType = 
    | 'TASK_CREATED' 
    | 'TASK_COMPLETED' 
    | 'TASK_ASSIGNED' 
    | 'BOARD_CREATED' 
    | 'MEMBER_JOINED' 
    | 'COMMENT_ADDED'
    | 'TASK_OVERDUE';
  

  export interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
    enabled: boolean;
  }

  export interface DashboardQuery {
    period?: 'week' | 'month' | 'quarter';
    includeArchived?: boolean;
  }
  