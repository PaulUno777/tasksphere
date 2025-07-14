import { BoardRole } from '@core/types';
import { BoardSummary } from './board.model';
import { User } from './user.model';

export interface BoardMember {
  id: string;
  user: User;
  role: BoardRole;
  joinedAt: string;
  invitedBy?: User;
  isActive: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  receiveTaskUpdates: boolean;
  receiveMentions: boolean;
  receiveComments: boolean;
  receiveBoardActivity: boolean;
}

export interface BoardInvitation {
  id: string;
  token: string;
  email: string;
  role: BoardRole;
  board: BoardSummary;
  invitedBy: User;
  expiresAt: string;
  createdAt: string;
}
