import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  RefreshCw,
  Sun,
  Coffee,
  Moon,
} from 'lucide-angular';
import { User } from '@core/models';
import { TranslationService } from '@core/services';

/**
 * WelcomeHeaderComponent displays personalized greeting and refresh controls
 */
@Component({
  selector: 'app-welcome-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950 dark:to-accent-950 rounded-lg p-6 border border-border-default"
    >
      <div class="flex items-center justify-between">
        <!-- Welcome Message -->
        <div class="flex items-center space-x-4">
          <!-- Avatar -->
          <div
            class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg"
          >
            {{ getUserInitials() }}
          </div>

          <!-- Greeting -->
          <div>
            <h1 class="text-2xl font-bold text-text-default">
              {{ getGreeting() }}, {{ user?.firstName }}!
            </h1>
            <p class="text-text-muted">
              {{ getSubGreeting() }}
            </p>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center space-x-3">
          <!-- Last Updated -->
          @if (!isLoading) {
          <div class="text-right hidden sm:block">
            <p class="text-xs text-text-muted">
              {{ i18n.translate('dashboard.lastUpdated') || 'Last updated' }}
            </p>
            <p class="text-xs text-text-default">
              {{ getCurrentTime() }}
            </p>
          </div>
          }

          <!-- Refresh Button -->
          <button
            type="button"
            (click)="refresh.emit()"
            [disabled]="isLoading"
            class="btn-outline btn-sm"
            [attr.aria-label]="
              i18n.translate('dashboard.refresh') || 'Refresh dashboard'
            "
          >
            <lucide-icon
              [img]="RefreshCw"
              [size]="16"
              [class.animate-spin]="isLoading"
            ></lucide-icon>
            <span class="ml-2 hidden sm:inline">
              {{ i18n.translate('dashboard.refresh') || 'Refresh' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class WelcomeHeaderComponent {
  readonly RefreshCw = RefreshCw;
  readonly Sun = Sun;
  readonly Coffee = Coffee;
  readonly Moon = Moon;

  readonly i18n = inject(TranslationService);

  @Input() user: User | null = null;
  @Input() isLoading = false;
  @Output() refresh = new EventEmitter<void>();

  /**
   * Gets user initials for avatar
   */
  getUserInitials(): string {
    if (!this.user) return '?';
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }

  /**
   * Gets time-based greeting
   */
  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return this.i18n.t('dashboard.goodMorning') || 'Good morning';
    } else if (hour < 17) {
      return this.i18n.t('dashboard.goodAfternoon') || 'Good afternoon';
    } else {
      return this.i18n.t('dashboard.goodEvening') || 'Good evening';
    }
  }

  getSubGreeting(): string {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    return (
      this.i18n.t('dashboard.welcomeSubtext', { day: dayName }) ||
      `Here's what's happening on ${dayName}`
    );
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
