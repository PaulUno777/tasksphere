import { BoardSettings } from '@core/models';
import { TaskPriority } from './enum.types';

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  categoryId?: string;
  assignedTo?: string;
  dueDate?: string;
  startDate?: string;
}

export interface BoardFormData {
  title: string;
  description?: string;
  color: string;
  settings?: Partial<BoardSettings>;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  color: string;
}

export interface CommentFormData {
  content: string;
  mentions?: string[];
}
