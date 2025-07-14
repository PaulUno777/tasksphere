import { TaskPriority, TaskStatus } from '@core/types';
import { BoardSummary } from './board.model';
import { Category } from './category.model';
import { User } from './user.model';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  board: BoardSummary;
  categoryId?: string;
  assignees?: User[];
  createdBy: User;
  lastEditedBy?: User;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  canEdit: boolean;
  commentCount: number;
}

export interface KanbanBoard {
  todo: Task[];
  inProgress: Task[];
  review: Task[];
  completed: Task[];
}
