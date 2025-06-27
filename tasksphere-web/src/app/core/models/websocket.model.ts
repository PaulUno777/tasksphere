import { BoardMember } from './board.model';
import { NotificationPriority, NotificationType } from './notification.model';

export interface WebSocketMessage {
  type: 'connection' | 'notification' | 'board_update' | 'pong';
  data: any;
}

export interface WebSocketNotification {
  id: string;
  type: NotificationType;
  content: string;
  priority: NotificationPriority;
  createdAt: string;
  boardId?: string;
  taskId?: string;
}

export interface WebSocketBoardUpdate {
  boardId: string;
  action: string;
  member?: BoardMember;
}
