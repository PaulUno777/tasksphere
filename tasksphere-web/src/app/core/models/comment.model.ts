import { CommentType } from '@core/types';
import { User } from './user.model';

export interface Comment {
  id: string;
  content: string;
  type: CommentType;
  author: User;
  mentions: User[];
  reactions: CommentReaction[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CommentReaction {
  emoji: string;
  users: User[];
  count: number;
}
