import { Task } from '@core/models';
import { TaskStatus } from './enum.types';

export interface KanbanColumn {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  limit?: number; //display limit count
}

export interface KanbanData {
  todo: Task[];
  inProgress: Task[];
  review: Task[];
  completed: Task[];
}

export interface DragDropData {
  taskId: string;
  sourceStatus: TaskStatus;
  targetStatus: TaskStatus;
  newPosition: number;
}
