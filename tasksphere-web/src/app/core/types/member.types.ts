import { BoardSummary, User, UserSummary } from '@core/models';

export type AssignableBoardRole = 'ADMIN' | 'MEMBER' | 'GUEST';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface InviteMemberRequest {
  email: string;
  role: AssignableBoardRole;
  message?: string;
}

export interface InviteMultipleMembersRequest {
  emails: string[];
  role: AssignableBoardRole;
  message?: string;
}

export interface InviteMultipleMembersResponse {
  successful: string[];
  failed: string[];
  errors: string[];
}

export interface UpdateMemberRoleRequest {
  role: AssignableBoardRole;
}

export interface UpdateNotificationSettingsRequest {
  receiveTaskUpdates?: boolean;
  receiveMentions?: boolean;
  receiveComments?: boolean;
  receiveBoardActivity?: boolean;
}

export interface BoardInvitation {
  id: string;
  email: string;
  board: BoardSummary;
  role: AssignableBoardRole;
  token: string;
  status: InvitationStatus;
  invitedBy: UserSummary;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InviteMultipleResponse {
  successful: string[];
  failed: string[];
  errors: string[];
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface RejectInvitationRequest {
  token: string;
}
