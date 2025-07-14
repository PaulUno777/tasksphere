import { isPlatformBrowser } from '@angular/common';
import { effect, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { ThemeMode } from '@core/types';
import { environment } from 'src/app/environments/environment';

/**
 * ThemeService manages the application's theme state
 * Supports light, dark, and system themes with persistence
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = environment.storage.themeKey;
  readonly theme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Effect to apply theme changes
    effect(() => {
      this.applyTheme(this.theme());
    });

    // Listen for system theme changes when in browser
    if (isPlatformBrowser(this.platformId)) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.theme() === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  /**
   * Sets the theme and persists it to localStorage
   * @param theme - Theme mode to set
   */
  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    this.persistTheme(theme);
  }

  /**
   * Toggles between light and dark themes
   * If system theme is active, toggles to opposite of current system preference
   */
  toggleTheme(): void {
    const currentTheme = this.theme();

    if (currentTheme === 'light') {
      this.setTheme('dark');
    } else if (currentTheme === 'dark') {
      this.setTheme('light');
    } else {
      // If system theme, toggle to opposite of current system preference
      const systemIsDark = this.getSystemPreference();
      this.setTheme(systemIsDark ? 'light' : 'dark');
    }
  }

  /**
   * Gets the current theme display name for UI
   * @returns Human-readable theme name
   */
  getThemeDisplayName(): string {
    const theme = this.theme();
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  }

  /**
   * Gets the initial theme from localStorage or defaults to system
   * @returns Initial theme mode
   */
  private getInitialTheme(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) {
      return environment.app.defaultTheme;
    }

    try {
      const stored = localStorage.getItem(this.storageKey) as ThemeMode;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read theme preference from localStorage:', error);
    }

    return environment.app.defaultTheme;
  }

  /**
   * Applies the theme to the document
   * @param theme - Theme mode to apply
   */
  private applyTheme(theme: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let shouldBeDark = false;

    switch (theme) {
      case 'dark':
        shouldBeDark = true;
        break;
      case 'light':
        shouldBeDark = false;
        break;
      case 'system':
        shouldBeDark = this.getSystemPreference();
        break;
    }

    // Apply dark class to document root
    const htmlElement = document.documentElement;
    if (shouldBeDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // Update reactive state
    this.isDark.set(shouldBeDark);

    // Set color-scheme CSS property for better browser integration
    htmlElement.style.colorScheme = shouldBeDark ? 'dark' : 'light';
  }

  /**
   * Gets the system's preferred color scheme
   * @returns True if system prefers dark mode
   */
  private getSystemPreference(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Persists theme preference to localStorage
   * @param theme - Theme to persist
   */
  private persistTheme(theme: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }
  }
}
