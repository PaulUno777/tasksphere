import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, SquareKanban } from 'lucide-angular';
import { ThemeToggleComponent } from '@shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '@shared/components/language-selector/language-selector.component';
import { TranslationService } from '@core/services';
import { CommonModule } from '@angular/common';

/**
 * AuthLayoutComponent provides the layout structure for authentication pages
 * Features a clean, centered design with theme toggle and language selector
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LucideAngularModule,
    ThemeToggleComponent,
    LanguageSelectorComponent,
  ],
  templateUrl: "./auth-layout.html",
})
export class AuthLayoutComponent {
  readonly SquareKanban = SquareKanban;
  readonly i18n = inject(TranslationService);
}
