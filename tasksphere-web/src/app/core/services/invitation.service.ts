import { Injectable, inject } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { Board } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private readonly httpClient = inject(HttpClientService);

  async acceptInvitation(token: string): Promise<Board> {
    try {
      return await this.httpClient.post<Board>('/api/v1/invitations/accept', {
        token,
      });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  async rejectInvitation(token: string): Promise<void> {
    try {
      await this.httpClient.post<void>('/api/v1/invitations/reject', { token });
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      throw error;
    }
  }
}
