import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Home, ArrowLeft, Search } from 'lucide-angular';
import { TranslationService } from '@core/services';

/**
 * NotFoundComponent displays a 404 error page
 * Provides navigation options and helpful links
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div
      class="min-h-screen bg-background flex items-center justify-center px-4"
    >
      <div class="max-w-lg text-center">
        <!-- 404 Illustration -->
        <div class="mb-8">
          <div
            class="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <lucide-icon
              [img]="Search"
              [size]="64"
              class="text-primary-600"
            ></lucide-icon>
          </div>

          <h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <h2 class="text-2xl font-semibold text-text-default mb-2">
            {{ i18n.t('error.pageNotFound') }}
          </h2>
          <p class="text-text-muted mb-8">
            {{ i18n.t('error.pageNotFoundDesc') }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button type="button" (click)="goBack()" class="btn-outline btn-md">
            <lucide-icon
              [img]="ArrowLeft"
              [size]="16"
              class="mr-2"
            ></lucide-icon>
            {{ i18n.t('common.goBack') }}
          </button>

          <a routerLink="/dashboard" class="btn-primary btn-md">
            <lucide-icon [img]="Home" [size]="16" class="mr-2"></lucide-icon>
            {{ i18n.t('navigation.dashboard') }}
          </a>
        </div>

        <!-- Helpful Links -->
        <div class="mt-12 pt-8 border-t border-border-default">
          <p class="text-sm text-text-muted mb-4">
            {{ i18n.t('error.helpfulLinks') }}
          </p>
          <div class="flex flex-wrap justify-center gap-4 text-sm">
            <a
              routerLink="/boards"
              class="text-primary-600 hover:text-primary-700"
            >
              {{ i18n.t('navigation.boards') }}
            </a>
            <a
              routerLink="/tasks"
              class="text-primary-600 hover:text-primary-700"
            >
              {{ i18n.t('navigation.tasks') }}
            </a>
            <a
              routerLink="/profile"
              class="text-primary-600 hover:text-primary-700"
            >
              {{ i18n.t('common.profile') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  readonly Home = Home;
  readonly ArrowLeft = ArrowLeft;
  readonly Search = Search;

  readonly i18n = inject(TranslationService);

  /**
   * Goes back in browser history
   */
  goBack(): void {
    window.history.back();
  }
}
