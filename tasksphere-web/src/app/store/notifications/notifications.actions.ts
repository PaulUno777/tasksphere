import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Notification,
  NotificationsResponse,
  PaginationParams,
} from '@core/models';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    // Load notifications
    'Load Notifications': props<{ params?: PaginationParams }>(),
    'Load Notifications Success': props<{
      response: NotificationsResponse;
      append?: boolean;
    }>(),
    'Load Notifications Failure': props<{ error: string }>(),

    // Mark as read
    'Mark As Read': props<{ notificationId: string }>(),
    'Mark As Read Success': props<{ notificationId: string }>(),
    'Mark As Read Failure': props<{ error: string }>(),

    // Mark all as read
    'Mark All As Read': emptyProps(),
    'Mark All As Read Success': emptyProps(),
    'Mark All As Read Failure': props<{ error: string }>(),

    // Real-time notification
    'Add Real Time Notification': props<{ notification: Notification }>(),

    // Clear all
    'Clear All Notifications': emptyProps(),

    // Error handling
    'Clear Error': emptyProps(),
  },
});
