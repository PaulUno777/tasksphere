import { BoardRole, BoardStatus } from '@core/types';
import { User } from './user.model';

export interface Board {
  id: string;
  title: string;
  description?: string;
  color?: string;
  status: BoardStatus;
  owner: User;
  settings: BoardSettings;
  userRole: BoardRole;
  memberCount: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardSettings {
  allowComments: boolean;
  autoArchiveCompletedDays?: number;
  requireInviteApproval: boolean;
  allowMemberInvite: boolean;
}

export interface BoardSummary {
  id: string;
  title: string;
  color?: string;
}

export interface BoardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  lastActivity: Date;
  createdThisWeek: number;
  updatedThisWeek: number;
  completionRate: string;
  recentActivity: number;
}
