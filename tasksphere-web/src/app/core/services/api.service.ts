import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  AuthResponse,
  Board,
  BoardMember,
  BoardStats,
  Category,
  CreateBoardRequest,
  CreateCategoryRequest,
  CreateCommentRequest,
  CreateTaskRequest,
  NotificationsResponse,
  PaginationParams,
  Task,
  TaskComment,
  UpdateTaskRequest,
  User,
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Auth endpoints
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {
      email,
      password,
    });
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/register`,
      userData
    );
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh-token`, {
      refreshToken,
    });
  }

  // User endpoints
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/me`);
  }

  updateProfile(userData: Partial<User>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/users/me`, userData);
  }

  // Board endpoints
  getBoards(): Observable<{ boards: Board[] }> {
    return this.http.get<{ boards: Board[] }>(`${this.baseUrl}/boards`);
  }

  getBoardDetails(boardId: string): Observable<Board> {
    return this.http.get<Board>(`${this.baseUrl}/boards/${boardId}`);
  }

  createBoard(boardData: CreateBoardRequest): Observable<ApiResponse<Board>> {
    return this.http.post<ApiResponse<Board>>(
      `${this.baseUrl}/boards`,
      boardData
    );
  }

  updateBoard(
    boardId: string,
    boardData: Partial<Board>
  ): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}`,
      boardData
    );
  }

  deleteBoard(boardId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/boards/${boardId}`);
  }

  getBoardStats(boardId: string): Observable<BoardStats> {
    return this.http.get<BoardStats>(`${this.baseUrl}/boards/${boardId}/stats`);
  }

  // Board members
  getBoardMembers(boardId: string): Observable<{ members: BoardMember[] }> {
    return this.http.get<{ members: BoardMember[] }>(
      `${this.baseUrl}/boards/${boardId}/members`
    );
  }

  addBoardMember(
    boardId: string,
    email: string,
    role: string
  ): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}/members`,
      { email, role }
    );
  }

  updateMemberRole(
    boardId: string,
    userId: string,
    role: string
  ): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}/members/${userId}`,
      { role }
    );
  }

  removeBoardMember(boardId: string, userId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}/members/${userId}`
    );
  }

  revokeMemberAccess(boardId: string, email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}/members/revoke`,
      { email }
    );
  }

  // Categories
  getCategories(boardId: string): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(
      `${this.baseUrl}/boards/${boardId}/categories`
    );
  }

  createCategory(
    boardId: string,
    categoryData: CreateCategoryRequest
  ): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(
      `${this.baseUrl}/boards/${boardId}/categories`,
      categoryData
    );
  }

  updateCategory(
    boardId: string,
    categoryId: string,
    categoryData: Partial<Category>
  ): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}/categories/${categoryId}`,
      categoryData
    );
  }

  deleteCategory(boardId: string, categoryId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/boards/${boardId}/categories/${categoryId}`
    );
  }

  // Tasks
  createTask(
    boardId: string,
    taskData: CreateTaskRequest
  ): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(
      `${this.baseUrl}/boards/${boardId}/tasks`,
      taskData
    );
  }

  getTaskDetails(taskId: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/tasks/${taskId}`);
  }

  updateTask(
    taskId: string,
    taskData: UpdateTaskRequest
  ): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/tasks/${taskId}`,
      taskData
    );
  }

  deleteTask(taskId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/tasks/${taskId}`);
  }

  updateTaskStatus(taskId: string, status: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/tasks/${taskId}/status`,
      { status }
    );
  }

  assignTask(
    taskId: string,
    assignedToId: string | null
  ): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/tasks/${taskId}/assign`,
      { assignedToId }
    );
  }

  // Comments
  getTaskComments(taskId: string): Observable<{ comments: TaskComment[] }> {
    return this.http.get<{ comments: TaskComment[] }>(
      `${this.baseUrl}/tasks/${taskId}/comments`
    );
  }

  addComment(
    taskId: string,
    commentData: CreateCommentRequest
  ): Observable<ApiResponse<TaskComment>> {
    return this.http.post<ApiResponse<TaskComment>>(
      `${this.baseUrl}/tasks/${taskId}/comments`,
      commentData
    );
  }

  updateComment(
    taskId: string,
    commentId: string,
    content: string
  ): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/tasks/${taskId}/comments/${commentId}`,
      { content }
    );
  }

  deleteComment(taskId: string, commentId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/tasks/${taskId}/comments/${commentId}`
    );
  }

  // Notifications
  getNotifications(
    params?: PaginationParams
  ): Observable<NotificationsResponse> {
    let httpParams = new HttpParams();
    if (params?.limit)
      httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.offset)
      httpParams = httpParams.set('offset', params.offset.toString());

    return this.http.get<NotificationsResponse>(
      `${this.baseUrl}/notifications`,
      { params: httpParams }
    );
  }

  markNotificationAsRead(notificationId: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/notifications/${notificationId}/read`,
      {}
    );
  }

  markAllNotificationsAsRead(): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/notifications/read-all`,
      {}
    );
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl.replace('/api', '')}/health`);
  }
}
