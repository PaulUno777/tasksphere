import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sun, Moon, Monitor } from 'lucide-angular';
import { ThemeService } from '@core/services/theme.service';
import { ThemeMode } from '@core/types';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative">
      <!-- Theme Toggle Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="flex items-center justify-center w-10 h-10 rounded-lg bg-surface hover:bg-surface-muted border border-border-default transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        [attr.aria-label]="
          'Switch theme - Currently ' + themeService.getThemeDisplayName()
        "
      >
        @switch (themeService.theme()) { @case ('light') {
        <lucide-icon
          [img]="Sun"
          [size]="18"
          class="text-text-default"
        ></lucide-icon>
        } @case ('dark') {
        <lucide-icon
          [img]="Moon"
          [size]="18"
          class="text-text-default"
        ></lucide-icon>
        } @case ('system') {
        <lucide-icon
          [img]="Monitor"
          [size]="18"
          class="text-text-default"
        ></lucide-icon>
        } }
      </button>

      <!-- Dropdown Menu -->
      @if (showDropdown) {
      <div
        class="absolute right-0 mt-2 w-48 bg-surface border border-border-default rounded-lg shadow-lg z-50 py-1"
        (click)="$event.stopPropagation()"
      >
        <!-- Light Theme Option -->
        <button
          type="button"
          (click)="setTheme('light')"
          class="w-full flex items-center px-4 py-2 text-sm text-text-default hover:bg-surface-muted transition-colors duration-200"
          [class.bg-surface-muted]="themeService.theme() === 'light'"
        >
          <lucide-icon
            [img]="Sun"
            [size]="16"
            class="mr-3 text-amber-500"
          ></lucide-icon>
          <span>Light</span>
          @if (themeService.theme() === 'light') {
          <div class="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
          }
        </button>

        <!-- Dark Theme Option -->
        <button
          type="button"
          (click)="setTheme('dark')"
          class="w-full flex items-center px-4 py-2 text-sm text-text-default hover:bg-surface-muted transition-colors duration-200"
          [class.bg-surface-muted]="themeService.theme() === 'dark'"
        >
          <lucide-icon
            [img]="Moon"
            [size]="16"
            class="mr-3 text-indigo-500"
          ></lucide-icon>
          <span>Dark</span>
          @if (themeService.theme() === 'dark') {
          <div class="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
          }
        </button>

        <!-- System Theme Option -->
        <button
          type="button"
          (click)="setTheme('system')"
          class="w-full flex items-center px-4 py-2 text-sm text-text-default hover:bg-surface-muted transition-colors duration-200"
          [class.bg-surface-muted]="themeService.theme() === 'system'"
        >
          <lucide-icon
            [img]="Monitor"
            [size]="16"
            class="mr-3 text-gray-500"
          ></lucide-icon>
          <span>System</span>
          @if (themeService.theme() === 'system') {
          <div class="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
          }
        </button>
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
    </div>
  `,
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Monitor = Monitor;

  showDropdown = false;

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
    this.closeDropdown();
  }
}
