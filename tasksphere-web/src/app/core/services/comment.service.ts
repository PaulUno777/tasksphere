import { Injectable, inject } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { Comment } from '@core/models';
import {
  AddReactionRequest,
  BaseQuery,
  CommentQuery,
  CreateCommentRequest,
  PaginatedResponse,
  UpdateCommentRequest,
} from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly httpClient = inject(HttpClientService);

  async createComment(
    taskId: string,
    commentData: CreateCommentRequest
  ): Promise<Comment> {
    try {
      return await this.httpClient.post<Comment>(
        `/api/v1/tasks/${taskId}/comments`,
        commentData
      );
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }

  async getComment(id: string): Promise<Comment> {
    try {
      return await this.httpClient.get<Comment>(`/api/v1/comments/${id}`);
    } catch (error) {
      console.error('Failed to get comment:', error);
      throw error;
    }
  }

  async updateComment(
    id: string,
    commentData: UpdateCommentRequest
  ): Promise<Comment> {
    try {
      return await this.httpClient.put<Comment>(
        `/api/v1/comments/${id}`,
        commentData
      );
    } catch (error) {
      console.error('Failed to update comment:', error);
      throw error;
    }
  }

  async deleteComment(id: string): Promise<void> {
    try {
      await this.httpClient.delete<void>(`/api/v1/comments/${id}`);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }

  async addReaction(
    id: string,
    reactionData: AddReactionRequest
  ): Promise<Comment> {
    try {
      return await this.httpClient.post<Comment>(
        `/api/v1/comments/${id}/reactions`,
        reactionData
      );
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  async removeReaction(id: string, emoji: string): Promise<Comment> {
    try {
      return await this.httpClient.delete<Comment>(
        `/api/v1/comments/${id}/reactions/${emoji}`
      );
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  async getTaskComments(
    taskId: string,
    params?: CommentQuery
  ): Promise<PaginatedResponse<Comment>> {
    try {
      return await this.httpClient.get<PaginatedResponse<Comment>>(
        `/api/v1/tasks/${taskId}/comments`,
        params
      );
    } catch (error) {
      console.error('Failed to get task comments:', error);
      throw error;
    }
  }

  async getMyMentions(params?: BaseQuery): Promise<PaginatedResponse<Comment>> {
    try {
      return await this.httpClient.get<PaginatedResponse<Comment>>(
        '/api/v1/my/mentions',
        params
      );
    } catch (error) {
      console.error('Failed to get my mentions:', error);
      throw error;
    }
  }
}
