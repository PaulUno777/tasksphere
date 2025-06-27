export type NotificationType =
  | 'BOARD_INVITE'
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATE'
  | 'TASK_COMMENT'
  | 'DUE_DATE_PASSED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  priority: NotificationPriority;
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
  board?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}
