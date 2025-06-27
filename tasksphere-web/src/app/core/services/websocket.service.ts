import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import {
  WebSocketMessage,
  WebSocketNotification,
  WebSocketBoardUpdate,
} from '../models';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Signals
  private connectionStatusSignal = signal<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  connect(): void {
    const token = this.authService.getStoredToken();
    if (!token || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatusSignal.set('connecting');
    const wsUrl = `${environment.wsUrl}/notifications?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.connectionStatusSignal.set('disconnected');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatusSignal.set('disconnected');
    this.reconnectAttempts = 0;
  }

  sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  markNotificationAsRead(notificationId: string): void {
    this.sendMessage({
      type: 'notification_read',
      data: { notificationId },
    });
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connectionStatusSignal.set('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.connectionStatusSignal.set('disconnected');

      if (event.code !== 1000) {
        // Not a normal closure
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatusSignal.set('disconnected');
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'connection':
        console.log('WebSocket connection confirmed:', message.data.message);
        break;

      case 'notification':
        const notification = message.data as WebSocketNotification;
        this.notificationService.addRealTimeNotification(notification);
        break;

      case 'board_update':
        const boardUpdate = message.data as WebSocketBoardUpdate;
        this.handleBoardUpdate(boardUpdate);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private handleBoardUpdate(update: WebSocketBoardUpdate): void {
    // Emit board update events that components can listen to
    console.log('Board update received:', update);
    // This could trigger NgRx actions or other state updates
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.connect();
      }
    }, delay);
  }
}
