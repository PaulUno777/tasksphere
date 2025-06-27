import { Task, TaskStatus } from "./task.model";

export interface DragDropData {
  taskId: string;
  sourceStatus: TaskStatus;
  targetStatus: TaskStatus;
  sourceIndex: number;
  targetIndex: number;
}

export interface ColumnData {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}
