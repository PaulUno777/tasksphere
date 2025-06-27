import { Category } from './category.model';
import { Task } from './task.model';
import { User } from './user.model';

export type BoardRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Board {
  id: string;
  title: string;
  description?: string;
  role: BoardRole;
  createdAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  categories?: Category[];
  tasks?: Task[];
}

export interface BoardMember {
  id: string;
  role: BoardRole;
  joinedAt: string;
  user: User;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
}

export interface BoardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  statusDistribution: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    COMPLETED: number;
    ARCHIVED: number;
  };
  completionRate: number;
}
