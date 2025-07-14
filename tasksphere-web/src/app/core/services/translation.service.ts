import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { SupportedLanguage } from '@core/types';
import { environment } from 'src/app/environments/environment';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = environment.storage.languageKey;

  readonly currentLanguage = signal<SupportedLanguage>(
    this.getInitialLanguage()
  );
  readonly isLoading = signal<boolean>(false);

  // Cached translations to avoid repeated HTTP requests
  private translationCache = new Map<SupportedLanguage, Record<string, any>>();
  private currentTranslations: Record<string, any> = {};

  constructor() {
    // Initialize with the current language
    this.loadTranslations(this.currentLanguage());
  }

  /**
   * Gets all available languages
   * @returns Array of supported languages
   */
  getAvailableLanguages(): SupportedLanguage[] {
    return ['en', 'fr'];
  }

  /**
   * Gets the current language
   * @returns Current language code
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage();
  }

  /**
   * Sets the language and loads corresponding translations
   * @param language - Language to set
   */
  async setLanguage(language: SupportedLanguage): Promise<void> {
    if (language === this.currentLanguage()) {
      return; // No change needed
    }

    this.isLoading.set(true);

    try {
      await this.loadTranslations(language);
      this.currentLanguage.set(language);
      this.persistLanguage(language);
    } catch (error) {
      console.error(
        'Failed to load translations for language:',
        language,
        error
      );
      // Fallback to English if loading fails
      if (language !== 'en') {
        await this.loadTranslations('en');
        this.currentLanguage.set('en');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Translates a key with optional interpolation
   * @param key - Translation key (dot notation supported)
   * @param params - Parameters for interpolation
   * @returns Translated string
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const translation = this.getNestedValue(this.currentTranslations, key);

    if (translation === undefined || translation === null) {
      console.warn(`Translation missing for key: ${key}`);
      return key; // Return the key itself as fallback
    }

    // Handle interpolation if params are provided
    if (params && typeof translation === 'string') {
      return this.interpolate(translation, params);
    }

    return translation.toString();
  }

  /**
   * Shorthand alias for translate method
   * @param key - Translation key
   * @param params - Parameters for interpolation
   * @returns Translated string
   */
  t(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  /**
   * Gets a translation object for a namespace
   * @param namespace - Namespace key (e.g., 'auth', 'common')
   * @returns Translation object for the namespace
   */
  getNamespace(namespace: string): Record<string, any> {
    return this.getNestedValue(this.currentTranslations, namespace) || {};
  }

  /**
   * Checks if a translation key exists
   * @param key - Translation key to check
   * @returns True if key exists
   */
  hasTranslation(key: string): boolean {
    return this.getNestedValue(this.currentTranslations, key) !== undefined;
  }

  /**
   * Gets the display name for a language
   * @param language - Language code
   * @returns Human-readable language name
   */
  getLanguageDisplayName(language: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
      en: 'English',
      fr: 'Français',
    };
    return names[language] || language;
  }

  /**
   * Gets the initial language from localStorage or browser
   * @returns Initial language code
   */
  private getInitialLanguage(): SupportedLanguage {
    if (!isPlatformBrowser(this.platformId)) {
      return environment.app.defaultLanguage;
    }

    // Try to get from localStorage first
    try {
      const stored = localStorage.getItem(this.storageKey) as SupportedLanguage;
      if (stored && this.getAvailableLanguages().includes(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn(
        'Failed to read language preference from localStorage:',
        error
      );
    }

    // Fallback to browser language detection
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    if (this.getAvailableLanguages().includes(browserLang)) {
      return browserLang;
    }

    // Final fallback to default language
    return environment.app.defaultLanguage;
  }

  /**
   * Loads translations for a specific language
   * @param language - Language to load
   */
  private async loadTranslations(language: SupportedLanguage): Promise<void> {
    // Check cache first
    if (this.translationCache.has(language)) {
      this.currentTranslations = this.translationCache.get(language)!;
      return;
    }

    try {
      // Load translations from JSON file
      const translations = await firstValueFrom(
        this.http.get<Record<string, any>>(`/assets/i18n/${language}.json`)
      );

      // Cache the translations
      this.translationCache.set(language, translations);
      this.currentTranslations = translations;

      console.log(`Translations loaded for language: ${language}`);
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
      throw error;
    }
  }

  /**
   * Gets a nested value from an object using dot notation
   * @param obj - Object to search in
   * @param path - Dot-separated path
   * @returns Value at the path or undefined
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  /**
   * Interpolates parameters into a translation string
   * @param translation - Translation string with placeholders
   * @param params - Parameters to interpolate
   * @returns Interpolated string
   */
  private interpolate(
    translation: string,
    params: Record<string, string | number>
  ): string {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = params[key];
      return value !== undefined ? value.toString() : match;
    });
  }

  /**
   * Persists language preference to localStorage
   * @param language - Language to persist
   */
  private persistLanguage(language: SupportedLanguage): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.setItem(this.storageKey, language);
    } catch (error) {
      console.warn(
        'Failed to save language preference to localStorage:',
        error
      );
    }
  }
}
