export type ThemeMode = 'light' | 'dark' | 'system';
export type SupportedLanguage = 'en' | 'fr';

export type BoardStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'ALL';
export type BoardRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CommentType = 'COMMENT' | 'SYSTEM' | 'MENTION';
