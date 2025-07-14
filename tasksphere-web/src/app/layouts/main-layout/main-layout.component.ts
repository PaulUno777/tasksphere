import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Home,
  Folder,
  CheckSquare,
  Users,
  MessageSquare,
  SquareKanban,
  Globe,
  Sun,
  Moon,
  LayoutDashboard,
} from 'lucide-angular';

// Store imports
import { AuthStore } from '@store/auth.store';
import { BoardsStore } from '@store/boards.store';
import { TasksStore } from '@store/tasks.store';

// Service imports
import { TranslationService, ThemeService } from '@core/services';

// Component imports
import { ThemeToggleComponent } from '@shared/components/theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '@shared/components/language-selector/language-selector.component';
import { ToastContainerComponent } from '@shared/components/toast-container/toast-container.component';
import { SupportedLanguage } from '@core/types';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    LucideAngularModule,
    ThemeToggleComponent,
    LanguageSelectorComponent,
    ToastContainerComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  // Icons
  protected readonly Menu = Menu;
  protected readonly X = X;
  protected readonly Bell = Bell;
  protected readonly Search = Search;
  protected readonly Plus = Plus;
  protected readonly Settings = Settings;
  protected readonly LogOut = LogOut;
  protected readonly User = User;
  protected readonly ChevronDown = ChevronDown;
  protected readonly Home = Home;
  protected readonly Folder = Folder;
  protected readonly CheckSquare = CheckSquare;
  protected readonly Users = Users;
  protected readonly MessageSquare = MessageSquare;
  protected readonly SquareKanban = SquareKanban;
  protected readonly Globe = Globe;
  protected readonly Sun = Sun;
  protected readonly Moon = Moon;
  protected readonly LayoutDashboard = LayoutDashboard;
  protected readonly Notification = Notification;

  // Store injections
  authStore = inject(AuthStore);
  boardsStore = inject(BoardsStore);
  tasksStore = inject(TasksStore);

  // Service injections
  i18n = inject(TranslationService);
  themeService = inject(ThemeService);

  private router = inject(Router);

  // Component state
  showMobileMenu = signal(false);
  showUserDropdown = signal(false);
  showLanguageDropdown = signal(false);
  showNotifications = signal(false);
  sidebarOpen = signal(true);

  // Data
  availableLanguages = ['en', 'fr', 'es'];
  notificationCount = computed(() => 3); // TODO: Implement from notifications store

  // Computed properties
  isMobile = computed(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );

  recentBoards = computed(() =>
    this.boardsStore
      .boards()
      .filter((board) => board.status === 'ACTIVE')
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5)
  );

  unreadMentions = computed(() => 3); // TODO: Implement from comments store

  ngOnInit() {
    // Load initial data
    this.loadInitialData();

    // Setup responsive handling
    this.setupResponsiveHandling();

    // Setup click outside handlers
    this.setupClickOutsideHandlers();
  }

  private async loadInitialData() {
    try {
      await Promise.all([
        this.boardsStore.loadBoards(),
        this.tasksStore.loadMyTasks(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  private setupResponsiveHandling() {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;

      if (isMobile && this.sidebarOpen()) {
        this.sidebarOpen.set(false);
      }

      if (!isMobile && this.showMobileMenu()) {
        this.showMobileMenu.set(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
  }

  private setupClickOutsideHandlers() {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Close dropdowns when clicking outside
      if (!target.closest('.dropdown-container')) {
        this.showUserDropdown.set(false);
        this.showLanguageDropdown.set(false);
        this.showNotifications.set(false);
      }
    });
  }

  // Navigation methods
  toggleMobileMenu() {
    this.showMobileMenu.update((show) => !show);
  }

  closeMobileMenu() {
    this.showMobileMenu.set(false);
  }

  toggleSidebar() {
    this.sidebarOpen.update((open) => !open);
  }

  // Dropdown methods
  toggleUserDropdown() {
    this.showUserDropdown.update((show) => !show);
    this.showLanguageDropdown.set(false);
    this.showNotifications.set(false);
  }

  toggleLanguageDropdown() {
    this.showLanguageDropdown.update((show) => !show);
    this.showUserDropdown.set(false);
    this.showNotifications.set(false);
  }

  toggleNotifications() {
    this.showNotifications.update((show) => !show);
    this.showUserDropdown.set(false);
    this.showLanguageDropdown.set(false);
  }

  // User methods
  getCurrentUser() {
    return (
      this.authStore.user() || { fullName: 'User', email: 'user@example.com' }
    );
  }

  getUserInitials() {
    const user = this.getCurrentUser();
    return user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  // Language methods
  changeLanguage(lang: SupportedLanguage) {
    this.i18n.setLanguage(lang);
    this.showLanguageDropdown.set(false);
  }

  getLanguageLabel(lang: string) {
    const labels: Record<string, string> = {
      en: 'English',
      fr: 'Français',
    };
    return labels[lang] || lang;
  }

  // Auth methods
  async logout() {
    try {
      await this.authStore.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Navigation helpers
  navigateToProfile() {
    this.router.navigate(['/profile']);
    this.showUserDropdown.set(false);
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
    this.showUserDropdown.set(false);
  }

  createNewTask() {
    // TODO: Implement create task modal
    console.log('Create new task');
  }

  createNewBoard() {
    this.router.navigate(['/boards/create']);
  }
}
