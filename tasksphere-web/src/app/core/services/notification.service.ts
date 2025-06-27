import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { Notification, NotificationsResponse, WebSocketNotification, ToastMessage } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiService = inject(ApiService);

  // Signals for notifications
  private notificationsSignal = signal<Notification[]>([]);
  private unreadCountSignal = signal(0);
  private isLoadingSignal = signal(false);
  private toastMessagesSignal = signal<ToastMessage[]>([]);

  // Computed signals
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly toastMessages = this.toastMessagesSignal.asReadonly();
  readonly hasUnreadNotifications = computed(() => this.unreadCount() > 0);

  private toastIdCounter = 0;

  loadNotifications(limit = 50, offset = 0): Observable<NotificationsResponse> {
    this.isLoadingSignal.set(true);
    return this.apiService.getNotifications({ limit, offset }).pipe(
      tap((response: NotificationsResponse) => {
        if (offset === 0) {
          this.notificationsSignal.set(response.notifications);
        } else {
          this.notificationsSignal.update(current => [...current, ...response.notifications]);
        }
        this.updateUnreadCount();
        this.isLoadingSignal.set(false);
      })
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.apiService.markNotificationAsRead(notificationId).pipe(
      tap(() => {
        this.notificationsSignal.update(notifications =>
          notifications.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        this.updateUnreadCount();
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.apiService.markAllNotificationsAsRead().pipe(
      tap(() => {
        this.notificationsSignal.update(notifications =>
          notifications.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCountSignal.set(0);
      })
    );
  }

  addRealTimeNotification(wsNotification: WebSocketNotification): void {
    const notification: Notification = {
      id: wsNotification.id,
      type: wsNotification.type,
      content: wsNotification.content,
      priority: wsNotification.priority,
      isRead: false,
      isDelivered: true,
      createdAt: wsNotification.createdAt,
      board: wsNotification.boardId ? { id: wsNotification.boardId, title: '' } : undefined,
      task: wsNotification.taskId ? { id: wsNotification.taskId, title: '' } : undefined
    };

    this.notificationsSignal.update(current => [notification, ...current]);
    this.updateUnreadCount();
    
    // Show toast for real-time notifications
    this.showToast({
      type: 'info',
      title: 'New Notification',
      message: notification.content
    });
  }

  private updateUnreadCount(): void {
    const unread = this.notificationsSignal().filter(n => !n.isRead).length;
    this.unreadCountSignal.set(unread);
  }

  // Toast message methods
  showToast(config: Omit<ToastMessage, 'id'>): void {
    const toast: ToastMessage = {
      id: `toast-${++this.toastIdCounter}`,
      duration: 5000,
      ...config
    };

    this.toastMessagesSignal.update(toasts => [...toasts, toast]);

    // Auto-remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  removeToast(toastId: string): void {
    this.toastMessagesSignal.update(toasts => 
      toasts.filter(toast => toast.id !== toastId)
    );
  }

  showSuccess(title: string, message?: string): void {
    this.showToast({ type: 'success', title, message });
  }

  showError(title: string, message?: string): void {
    this.showToast({ type: 'error', title, message, duration: 8000 });
  }

  showWarning(title: string, message?: string): void {
    this.showToast({ type: 'warning', title, message });
  }

  showInfo(title: string, message?: string): void {
    this.showToast({ type: 'info', title, message });
  }

  clearAllNotifications(): void {
    this.notificationsSignal.set([]);
    this.unreadCountSignal.set(0);
  }
}