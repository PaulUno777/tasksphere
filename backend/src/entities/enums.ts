export enum NotificationType {
  BOARD_INVITE = 'BOARD_INVITE',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_COMMENT = 'TASK_COMMENT',
  DUE_DATE_PASSED = 'DUE_DATE_PASSED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum BoardRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}
