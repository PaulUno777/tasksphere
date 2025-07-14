import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Task, KanbanBoard } from '../models';
import {
  AssignTaskRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  UpdateTaskPositionRequest,
  TaskQuery,
  PaginatedResponse,
} from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly httpClient = inject(HttpClientService);

  // Get board tasks
  getBoardTasks(
    boardId: string,
    params: TaskQuery = {}
  ): Promise<PaginatedResponse<Task>> {
    return this.httpClient.getPaginated<Task>(
      `/api/v1/boards/${boardId}/tasks`,
      params
    );
  }

  // Get kanban board view
  getKanbanBoard(boardId: string): Promise<KanbanBoard> {
    return this.httpClient.get<KanbanBoard>(
      `/api/v1/boards/${boardId}/tasks/kanban`
    );
  }

  // Get user's tasks
  getMyTasks(params: TaskQuery = {}): Promise<PaginatedResponse<Task>> {
    return this.httpClient.getPaginated<Task>('/api/v1/my/tasks', params);
  }

  // Get user's tasks in kanban format
  getMyTasksKanban(): Observable<{ data: KanbanBoard }> {
    // TODO: Replace with actual API endpoint when available
    // For now, simulate kanban data structure
    return of({
      data: {
        todo: [],
        inProgress: [],
        review: [],
        completed: []
      }
    });
  }

  // Get single task
  getTask(taskId: string): Promise<Task> {
    return this.httpClient.get<Task>(`/api/v1/tasks/${taskId}`);
  }

  // Create task
  createTask(boardId: string, taskData: CreateTaskRequest): Promise<Task> {
    return this.httpClient.post<Task>(
      `/api/v1/boards/${boardId}/tasks`,
      taskData
    );
  }

  // Update task
  updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
    return this.httpClient.put<Task>(`/api/v1/tasks/${taskId}`, updates);
  }

  // Update task status
  updateTaskStatus(
    taskId: string,
    statusData: UpdateTaskStatusRequest
  ): Promise<Task> {
    return this.httpClient.put<Task>(
      `/api/v1/tasks/${taskId}/status`,
      statusData
    );
  }

  // Assign/unassign task
  assignTask(taskId: string, assignData: AssignTaskRequest): Promise<Task> {
    return this.httpClient.put<Task>(
      `/api/v1/tasks/${taskId}/assign`,
      assignData
    );
  }

  // Update task position (for drag & drop)
  updateTaskPosition(
    taskId: string,
    positionData: UpdateTaskPositionRequest
  ): Promise<Task> {
    return this.httpClient.put<Task>(
      `/api/v1/tasks/${taskId}/position`,
      positionData
    );
  }

  // Archive task
  archiveTask(taskId: string): Promise<void> {
    return this.httpClient.put<void>(`/api/v1/tasks/${taskId}/archive`, {});
  }

  // Restore task
  restoreTask(taskId: string): Promise<void> {
    return this.httpClient.put<void>(`/api/v1/tasks/${taskId}/restore`, {});
  }

  // Delete task
  deleteTask(taskId: string): Promise<void> {
    return this.httpClient.delete<void>(`/api/v1/tasks/${taskId}`);
  }
}
