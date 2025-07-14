import {
  BoardStatus,
  TaskStatus,
  TaskPriority,
  CommentType,
  BoardRole,
} from './enum.types';

export interface BaseQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BoardQuery extends BaseQuery {
  status?: BoardStatus;
  updatedAfter?: string;
  userRole?: BoardRole;
  starred?: boolean;
}

export interface TaskQuery extends BaseQuery {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  categoryId?: string;
  isOverdue?: boolean;
  dueBefore?: string;
  dueAfter?: string;
}

export interface CommentQuery extends BaseQuery {
  type?: CommentType;
  authorId?: string;
}
