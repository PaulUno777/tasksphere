import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Globe, Check } from 'lucide-angular';
import { TranslationService } from '@core/services';
import { SupportedLanguage } from '@core/types';

/**
 * LanguageSelectorComponent provides a UI control for switching application language
 * Displays current language and allows selection from available languages
 */
@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative">
      <!-- Language Selector Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-surface hover:bg-surface-muted border border-border-default transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        [attr.aria-label]="
          'Change language - Currently ' +
          i18n.getLanguageDisplayName(i18n.getCurrentLanguage())
        "
      >
        <lucide-icon
          [img]="Globe"
          [size]="16"
          class="text-text-muted"
        ></lucide-icon>
        <span class="text-sm text-text-default">
          {{ i18n.getLanguageDisplayName(i18n.getCurrentLanguage()) }}
        </span>
      </button>

      <!-- Dropdown Menu -->
      @if (showDropdown) {
      <div
        class="absolute right-0 mt-2 w-40 bg-surface border border-border-default rounded-lg shadow-lg z-50 py-1"
        (click)="$event.stopPropagation()"
      >
        @for (language of availableLanguages; track language) {
        <button
          type="button"
          (click)="changeLanguage(language)"
          class="w-full flex items-center justify-between px-4 py-2 text-sm text-text-default hover:bg-surface-muted transition-colors duration-200"
          [class.bg-surface-muted]="language === currentLanguage"
        >
          <span>{{ i18n.getLanguageDisplayName(language) }}</span>
          @if (language === currentLanguage) {
          <lucide-icon
            [img]="Check"
            [size]="16"
            class="text-primary-500"
          ></lucide-icon>
          }
        </button>
        }
      </div>
      }

      <!-- Backdrop for closing dropdown -->
      @if (showDropdown) {
      <div
        class="fixed inset-0 z-40"
        (click)="closeDropdown()"
        aria-hidden="true"
      ></div>
      }

      <!-- Loading indicator -->
      @if (i18n.isLoading()) {
      <div
        class="absolute inset-0 flex items-center justify-center bg-surface bg-opacity-75 rounded-lg"
      >
        <div
          class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
      }
    </div>
  `,
})
export class LanguageSelectorComponent {
  readonly Globe = Globe;
  readonly Check = Check;

  readonly i18n = inject(TranslationService);

  showDropdown = false;
  availableLanguages: SupportedLanguage[] = this.i18n.getAvailableLanguages();
  currentLanguage: SupportedLanguage = this.i18n.getCurrentLanguage();

  /**
   * Toggles the language dropdown visibility
   */
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Closes the language dropdown
   */
  closeDropdown(): void {
    this.showDropdown = false;
  }

  /**
   * Changes the application language
   * @param language - Language to set
   */
  async changeLanguage(language: SupportedLanguage): Promise<void> {
    if (language === this.currentLanguage) {
      this.closeDropdown();
      return;
    }

    try {
      await this.i18n.setLanguage(language);
      this.currentLanguage = language;
      this.closeDropdown();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }
}
