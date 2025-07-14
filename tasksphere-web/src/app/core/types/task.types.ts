import { TaskPriority, TaskStatus } from './enum.types';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  categoryId?: string;
  assignedTo?: string;
  dueDate?: string;
  startDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  categoryId?: string;
  dueDate?: string;
  startDate?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface AssignTaskRequest {
  assignedTo?: string;
}

export interface UpdateTaskPositionRequest {
  position: number;
  status: TaskStatus;
}
