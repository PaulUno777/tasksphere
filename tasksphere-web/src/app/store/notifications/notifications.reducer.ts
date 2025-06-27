import { createFeature, createReducer, on } from '@ngrx/store';
import { Notification } from '../../core/models';
import { NotificationsActions } from './notifications.actions';

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  hasMore: false,
  isLoading: false,
  error: null
};

export const notificationsFeature = createFeature({
  name: 'notifications',
  reducer: createReducer(
    initialState,

    // Load notifications
    on(NotificationsActions.loadNotifications, (state) => ({
      ...state,
      isLoading: true,
      error: null
    })),

    on(NotificationsActions.loadNotificationsSuccess, (state, { response, append }) => ({
      ...state,
      notifications: append 
        ? [...state.notifications, ...response.notifications]
        : response.notifications,
      total: response.total,
      hasMore: response.hasMore,
      unreadCount: response.notifications.filter(n => !n.isRead).length,
      isLoading: false,
      error: null
    })),

    on(NotificationsActions.loadNotificationsFailure, (state, { error }) => ({
      ...state,
      isLoading: false,
      error
    })),

    // Mark as read
    on(NotificationsActions.markAsReadSuccess, (state, { notificationId }) => ({
      ...state,
      notifications: state.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),

    // Mark all as read
    on(NotificationsActions.markAllAsReadSuccess, (state) => ({
      ...state,
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    })),

    // Real-time notification
    on(NotificationsActions.addRealTimeNotification, (state, { notification }) => ({
      ...state,
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      total: state.total + 1
    })),

    // Clear all
    on(NotificationsActions.clearAllNotifications, () => initialState),

    // Clear error
    on(NotificationsActions.clearError, (state) => ({
      ...state,
      error: null
    }))
  )
});

export const {
  name: notificationsFeatureKey,
  reducer: notificationsReducer,
  selectNotifications,
  selectUnreadCount,
  selectTotal,
  selectHasMore,
  selectIsLoading,
  selectError
} = notificationsFeature;