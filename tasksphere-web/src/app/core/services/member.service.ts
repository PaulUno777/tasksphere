import { Injectable, inject } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  BoardMember,
  NotificationSettings,
  BoardInvitation,
  Board,
} from '@core/models';
import {
  InviteMemberRequest,
  InviteMultipleMembersRequest,
  InviteMultipleMembersResponse,
  UpdateMemberRoleRequest,
} from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private readonly httpClient = inject(HttpClientService);

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

  async inviteMember(
    boardId: string,
    inviteData: InviteMemberRequest
  ): Promise<BoardInvitation> {
    try {
      return await this.httpClient.post<BoardInvitation>(
        `/api/v1/boards/${boardId}/members/invite`,
        inviteData
      );
    } catch (error) {
      console.error('Failed to invite member:', error);
      throw error;
    }
  }

  async inviteMultipleMembers(
    boardId: string,
    inviteData: InviteMultipleMembersRequest
  ): Promise<InviteMultipleMembersResponse> {
    try {
      return await this.httpClient.post<{
        successful: string[];
        failed: string[];
        errors: string[];
      }>(`/api/v1/boards/${boardId}/members/invite-multiple`, inviteData);
    } catch (error) {
      console.error('Failed to invite multiple members:', error);
      throw error;
    }
  }

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

  async leaveBoard(boardId: string): Promise<void> {
    try {
      await this.httpClient.post<void>(`/api/v1/boards/${boardId}/leave`, null);
    } catch (error) {
      console.error('Failed to leave board:', error);
      throw error;
    }
  }

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

  canUserInvite(board: Board): boolean {
    return (
      board.userRole === 'OWNER' ||
      board.userRole === 'ADMIN' ||
      (board.userRole === 'MEMBER' && board.settings.allowMemberInvite)
    );
  }

  canUserManageBoard(board: Board): boolean {
    return board.userRole === 'OWNER' || board.userRole === 'ADMIN';
  }

  canUserDeleteBoard(board: Board): boolean {
    return board.userRole === 'OWNER';
  }
}
