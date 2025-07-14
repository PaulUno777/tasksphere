import { inject, Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  Board,
  BoardMember,
  BoardSettings,
  BoardStats,
  NotificationSettings,
  PaginatedResponse,
} from '@core/models';
import {
  BoardColor,
  BoardQuery,
  BoardTemplate,
  CreateBoardRequest,
  InviteMemberRequest,
  InviteMultipleMembersRequest,
  InviteMultipleResponse,
  UpdateBoardRequest,
  UpdateBoardSettingsRequest,
  UpdateMemberRoleRequest,
} from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private readonly httpClient = inject(HttpClientService);

  /**
   * Gets paginated list of user's boards
   * @param query - Query parameters for filtering and pagination
   * @returns Promise with paginated board response
   */
  async getBoards(query: BoardQuery = {}): Promise<PaginatedResponse<Board>> {
    try {
      return await this.httpClient.getPaginated<Board>('/api/v1/boards', query);
    } catch (error) {
      console.error('Failed to get boards:', error);
      throw error;
    }
  }

  /**
   * Gets a specific board by ID
   * @param boardId - Board ID to retrieve
   * @returns Promise with board data
   */
  async getBoardById(boardId: string): Promise<Board> {
    try {
      return await this.httpClient.get<Board>(`/api/v1/boards/${boardId}`);
    } catch (error) {
      console.error('Failed to get board:', error);
      throw error;
    }
  }

  /**
   * Creates a new board
   * @param boardData - Board creation data
   * @returns Promise with created board
   */
  async createBoard(boardData: CreateBoardRequest): Promise<Board> {
    try {
      return await this.httpClient.post<Board>('/api/v1/boards', boardData);
    } catch (error) {
      console.error('Failed to create board:', error);
      throw error;
    }
  }

  /**
   * Updates an existing board
   * @param boardId - Board ID to update
   * @param boardData - Board update data
   * @returns Promise with updated board
   */
  async updateBoard(
    boardId: string,
    boardData: UpdateBoardRequest
  ): Promise<Board> {
    try {
      return await this.httpClient.put<Board>(
        `/api/v1/boards/${boardId}`,
        boardData
      );
    } catch (error) {
      console.error('Failed to update board:', error);
      throw error;
    }
  }

  /**
   * Updates board settings
   * @param boardId - Board ID
   * @param settings - Settings to update
   * @returns Promise with updated settings
   */
  async updateBoardSettings(
    boardId: string,
    settings: UpdateBoardSettingsRequest
  ): Promise<BoardSettings> {
    try {
      return await this.httpClient.put<BoardSettings>(
        `/api/v1/boards/${boardId}/settings`,
        settings
      );
    } catch (error) {
      console.error('Failed to update board settings:', error);
      throw error;
    }
  }

  /**
   * Archives a board
   * @param boardId - Board ID to archive
   */
  async archiveBoard(boardId: string): Promise<void> {
    try {
      await this.httpClient.put<void>(`/api/v1/boards/${boardId}/archive`, {});
    } catch (error) {
      console.error('Failed to archive board:', error);
      throw error;
    }
  }

  /**
   * Restores an archived board
   * @param boardId - Board ID to restore
   */
  async restoreBoard(boardId: string): Promise<void> {
    try {
      await this.httpClient.put<void>(`/api/v1/boards/${boardId}/restore`, {});
    } catch (error) {
      console.error('Failed to restore board:', error);
      throw error;
    }
  }

  /**
   * Deletes a board permanently
   * @param boardId - Board ID to delete
   */
  async deleteBoard(boardId: string): Promise<void> {
    try {
      await this.httpClient.delete<void>(`/api/v1/boards/${boardId}`);
    } catch (error) {
      console.error('Failed to delete board:', error);
      throw error;
    }
  }

  /**
   * Gets board statistics
   * @param boardId - Board ID
   * @returns Promise with board statistics
   */
  async getBoardStats(boardId: string): Promise<BoardStats> {
    try {
      return await this.httpClient.get<BoardStats>(
        `/api/v1/boards/${boardId}/stats`
      );
    } catch (error) {
      console.error('Failed to get board stats:', error);
      throw error;
    }
  }

  /**
   * Gets board members
   * @param boardId - Board ID
   * @returns Promise with board members array
   */
  async getBoardMembers(boardId: string): Promise<BoardMember[]> {
    try {
      return await this.httpClient.get<BoardMember[]>(
        `/api/v1/boards/${boardId}/members`
      );
    } catch (error) {
      console.error('Failed to get board members:', error);
      throw error;
    }
  }

  /**
   * Invites a member to the board
   * @param boardId - Board ID
   * @param inviteData - Invitation data
   * @returns Promise with invitation result
   */
  async inviteMember(
    boardId: string,
    inviteData: InviteMemberRequest
  ): Promise<any> {
    try {
      return await this.httpClient.post(
        `/api/v1/boards/${boardId}/members/invite`,
        inviteData
      );
    } catch (error) {
      console.error('Failed to invite member:', error);
      throw error;
    }
  }

  /**
   * Invites multiple members to the board
   * @param boardId - Board ID
   * @param inviteData - Multiple invitation data
   * @returns Promise with invitation results
   */
  async inviteMultipleMembers(
    boardId: string,
    inviteData: InviteMultipleMembersRequest
  ): Promise<InviteMultipleResponse> {
    try {
      return await this.httpClient.post<InviteMultipleResponse>(
        `/api/v1/boards/${boardId}/members/invite-multiple`,
        inviteData
      );
    } catch (error) {
      console.error('Failed to invite multiple members:', error);
      throw error;
    }
  }

  /**
   * Updates a member's role
   * @param boardId - Board ID
   * @param memberId - Member ID
   * @param roleData - New role data
   * @returns Promise with updated member
   */
  async updateMemberRole(
    boardId: string,
    memberId: string,
    roleData: UpdateMemberRoleRequest
  ): Promise<BoardMember> {
    try {
      return await this.httpClient.put<BoardMember>(
        `/api/v1/boards/${boardId}/members/${memberId}/role`,
        roleData
      );
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  /**
   * Removes a member from the board
   * @param boardId - Board ID
   * @param memberId - Member ID to remove
   */
  async removeMember(boardId: string, memberId: string): Promise<void> {
    try {
      await this.httpClient.delete<void>(
        `/api/v1/boards/${boardId}/members/${memberId}`
      );
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }

  /**
   * Leaves a board (for non-owners)
   * @param boardId - Board ID to leave
   */
  async leaveBoard(boardId: string): Promise<void> {
    try {
      await this.httpClient.post<void>(`/api/v1/boards/${boardId}/leave`, {});
    } catch (error) {
      console.error('Failed to leave board:', error);
      throw error;
    }
  }

  /**
   * Updates notification settings for current user
   * @param boardId - Board ID
   * @param settings - Notification settings
   * @returns Promise with updated settings
   */
  async updateNotificationSettings(
    boardId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    try {
      return await this.httpClient.put<NotificationSettings>(
        `/api/v1/boards/${boardId}/members/notifications`,
        settings
      );
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Gets available board colors
   * @returns Array of predefined board colors
   */
  getBoardColors(): BoardColor[] {
    return [
      { name: 'Blue', value: '#3b82f6', textColor: '#ffffff' },
      { name: 'Green', value: '#10b981', textColor: '#ffffff' },
      { name: 'Purple', value: '#8b5cf6', textColor: '#ffffff' },
      { name: 'Pink', value: '#ec4899', textColor: '#ffffff' },
      { name: 'Red', value: '#ef4444', textColor: '#ffffff' },
      { name: 'Orange', value: '#f97316', textColor: '#ffffff' },
      { name: 'Yellow', value: '#eab308', textColor: '#000000' },
      { name: 'Teal', value: '#14b8a6', textColor: '#ffffff' },
      { name: 'Indigo', value: '#6366f1', textColor: '#ffffff' },
      { name: 'Gray', value: '#6b7280', textColor: '#ffffff' },
    ];
  }

  /**
   * Duplicates an existing board
   * @param boardId - Board ID to duplicate
   * @param newTitle - Title for the new board (optional)
   * @returns Promise with duplicated board
   */
  async duplicateBoard(boardId: string, newTitle?: string): Promise<Board> {
    try {
      const duplicateData = newTitle ? { title: newTitle } : {};
      return await this.httpClient.post<Board>(
        `/api/v1/boards/${boardId}/duplicate`,
        duplicateData
      );
    } catch (error) {
      console.error('Failed to duplicate board:', error);
      throw error;
    }
  }

  /**
   * Creates a board from template
   * @param templateId - Template ID to use
   * @param boardData - Board creation data
   * @returns Promise with created board
   */
  async createBoardFromTemplate(
    templateId: string,
    boardData: CreateBoardRequest
  ): Promise<Board> {
    try {
      return await this.httpClient.post<Board>('/api/v1/boards/from-template', {
        templateId,
        ...boardData,
      });
    } catch (error) {
      console.error('Failed to create board from template:', error);
      throw error;
    }
  }

  /**
   * Gets board templates
   * @returns Array of predefined board templates
   */
  getBoardTemplates(): BoardTemplate[] {
    return [
      {
        id: 'kanban',
        name: 'Kanban Board',
        description: 'Organize tasks with To Do, In Progress, and Done columns',
        color: '#3b82f6',
        defaultColumns: ['To Do', 'In Progress', 'Review', 'Done'],
        icon: 'Columns',
        category: 'project',
      },
      {
        id: 'sprint',
        name: 'Sprint Planning',
        description: 'Perfect for agile development teams',
        color: '#10b981',
        defaultColumns: ['Backlog', 'Sprint', 'In Progress', 'Testing', 'Done'],
        icon: 'Zap',
        category: 'team',
      },
      {
        id: 'personal',
        name: 'Personal Tasks',
        description: 'Simple board for personal task management',
        color: '#8b5cf6',
        defaultColumns: ['Ideas', 'To Do', 'Doing', 'Done'],
        icon: 'User',
        category: 'personal',
      },
      {
        id: 'content',
        name: 'Content Pipeline',
        description: 'Manage content creation workflow',
        color: '#ec4899',
        defaultColumns: ['Ideas', 'Writing', 'Review', 'Published'],
        icon: 'FileText',
        category: 'project',
      },
    ];
  }

  /**
   * Validates board creation data
   * @param boardData - Board data to validate
   * @returns Validation errors or null if valid
   */
  validateBoardData(
    boardData: CreateBoardRequest
  ): Record<string, string> | null {
    const errors: Record<string, string> = {};

    // Validate title
    if (!boardData.title || boardData.title.trim().length < 3) {
      errors['title'] = 'Board title must be at least 3 characters';
    }
    if (boardData.title && boardData.title.length > 100) {
      errors['title'] = 'Board title must be no more than 100 characters';
    }

    // Validate description
    if (boardData.description && boardData.description.length > 500) {
      errors['description'] =
        'Board description must be no more than 500 characters';
    }

    // Validate color
    if (!boardData.color || !/^#[0-9A-F]{6}$/i.test(boardData.color)) {
      errors['color'] = 'Please select a valid board color';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Validates email for invitation
   * @param email - Email to validate
   * @returns True if email is valid
   */
  validateInviteEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Searches boards by title
   * @param query - Search query
   * @param boards - Boards to search in
   * @returns Filtered boards
   */
  searchBoards(query: string, boards: Board[]): Board[] {
    if (!query.trim()) return boards;

    const searchTerm = query.toLowerCase().trim();
    return boards.filter(
      (board) =>
        board.title.toLowerCase().includes(searchTerm) ||
        board.description?.toLowerCase().includes(searchTerm)
    );
  }
}
