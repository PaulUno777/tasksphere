import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { LucideAngularModule, SquareKanban } from 'lucide-angular';
import { filter } from 'rxjs/operators';
import { ButtonComponent } from '../../ui/button/button.component';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { AuthActions } from '@store/auth/auth.actions';
import { selectUser, selectIsAuthenticated } from '@store/auth/auth.reducer';
import { selectUnreadCount } from '@store/notifications/notifications.reducer';
import { NotificationService } from '@core/services/notification.service';
import { DropdownItem } from '@core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LucideAngularModule,
    ButtonComponent,
    DropdownComponent,
    FormsModule,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Top Navigation Bar -->
      <nav
        class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Left Section - Logo and Navigation -->
            <div class="flex items-center space-x-8">
              <!-- Logo -->
              <div
                class="flex items-center space-x-2 cursor-pointer"
                (click)="navigateToHome()"
              >
                <div
                  class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="SquareKanban"
                    class="h-5 w-5 text-white"
                  ></lucide-icon>
                </div>
                <span class="text-xl font-bold text-gray-900">TaskSphere</span>
              </div>

              <!-- Navigation Links -->
              <div class="hidden md:flex items-center space-x-1">
                <app-button
                  variant="ghost"
                  size="sm"
                  [class.bg-primary-50]="isCurrentRoute('/dashboard')"
                  [class.text-primary-700]="isCurrentRoute('/dashboard')"
                  (clicked)="navigateTo('/dashboard')"
                >
                  <lucide-icon name="home" class="w-4 h-4 mr-2"></lucide-icon>
                  Dashboard
                </app-button>

                <app-button
                  variant="ghost"
                  size="sm"
                  [class.bg-primary-50]="isCurrentRoute('/boards')"
                  [class.text-primary-700]="isCurrentRoute('/boards')"
                  (clicked)="navigateTo('/boards')"
                >
                  <lucide-icon name="folder" class="w-4 h-4 mr-2"></lucide-icon>
                  Boards
                </app-button>

                <app-button
                  variant="ghost"
                  size="sm"
                  [class.bg-primary-50]="isCurrentRoute('/projects')"
                  [class.text-primary-700]="isCurrentRoute('/projects')"
                  (clicked)="navigateTo('/projects')"
                >
                  <lucide-icon
                    name="briefcase"
                    class="w-4 h-4 mr-2"
                  ></lucide-icon>
                  Projects
                </app-button>

                <app-button
                  variant="ghost"
                  size="sm"
                  [class.bg-primary-50]="isCurrentRoute('/teams')"
                  [class.text-primary-700]="isCurrentRoute('/teams')"
                  (clicked)="navigateTo('/teams')"
                >
                  <lucide-icon name="users" class="w-4 h-4 mr-2"></lucide-icon>
                  Teams
                </app-button>
              </div>
            </div>

            <!-- Center Section - Search -->
            <div class="hidden lg:flex flex-1 max-w-lg mx-8">
              <div class="relative w-full">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <lucide-icon
                    name="search"
                    class="h-5 w-5 text-gray-400"
                  ></lucide-icon>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks, boards, or people..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:bg-white"
                  [(ngModel)]="searchQuery"
                  (keyup.enter)="onSearch()"
                />
              </div>
            </div>

            <!-- Right Section - Actions and User -->
            <div class="flex items-center space-x-4">
              <!-- Quick Actions -->
              <div class="hidden sm:flex items-center space-x-2">
                <app-button
                  variant="ghost"
                  [iconOnly]="true"
                  icon="plus"
                  (clicked)="showQuickCreate()"
                  class="text-gray-600 hover:text-gray-900"
                ></app-button>
              </div>

              <!-- Notifications -->
              <div class="relative">
                <app-button
                  variant="ghost"
                  [iconOnly]="true"
                  icon="bell"
                  (clicked)="toggleNotifications()"
                  class="relative text-gray-600 hover:text-gray-900"
                >
                  <span
                    *ngIf="unreadCount() > 0"
                    class="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  >
                    {{ unreadCount() > 9 ? '9+' : unreadCount() }}
                  </span>
                </app-button>

                <!-- Notifications Dropdown -->
                <div
                  *ngIf="showNotificationsPanel()"
                  class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                      <h3 class="text-lg font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <app-button
                        variant="ghost"
                        size="sm"
                        (clicked)="markAllAsRead()"
                        class="text-sm text-primary-600"
                      >
                        Mark all read
                      </app-button>
                    </div>
                  </div>

                  <div class="max-h-96 overflow-y-auto">
                    <!-- Notification items would go here -->
                    <div class="p-4 text-center text-gray-500">
                      <lucide-icon
                        name="bell-off"
                        class="h-8 w-8 mx-auto mb-2 text-gray-300"
                      ></lucide-icon>
                      <p class="text-sm">No new notifications</p>
                    </div>
                  </div>

                  <div class="p-3 border-t border-gray-200">
                    <app-button
                      variant="ghost"
                      size="sm"
                      [fullWidth]="true"
                      (clicked)="viewAllNotifications()"
                    >
                      View all notifications
                    </app-button>
                  </div>
                </div>
              </div>

              <!-- User Menu -->
              <div class="relative">
                <app-dropdown
                  [items]="userMenuItems"
                  align="right"
                  (selectionChanged)="onUserMenuAction($event)"
                >
                  <div
                    class="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <div
                      class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    >
                      {{ getUserInitials() }}
                    </div>
                    <div class="hidden sm:block text-left">
                      <div class="text-sm font-medium text-gray-900">
                        {{ user()?.firstName }} {{ user()?.lastName }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ user()?.email }}
                      </div>
                    </div>
                    <lucide-icon
                      name="chevron-down"
                      class="w-4 h-4 text-gray-500"
                    ></lucide-icon>
                  </div>
                </app-dropdown>
              </div>

              <!-- Mobile Menu Button -->
              <div class="md:hidden">
                <app-button
                  variant="ghost"
                  [iconOnly]="true"
                  icon="menu"
                  (clicked)="toggleMobileMenu()"
                  class="text-gray-600"
                ></app-button>
              </div>
            </div>
          </div>

          <!-- Mobile Navigation Menu -->
          <div
            *ngIf="showMobileMenu()"
            class="md:hidden border-t border-gray-200 py-4"
          >
            <div class="space-y-2">
              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                [class.bg-primary-50]="isCurrentRoute('/dashboard')"
                (clicked)="navigateTo('/dashboard')"
                class="justify-start"
              >
                <lucide-icon name="home" class="w-4 h-4 mr-3"></lucide-icon>
                Dashboard
              </app-button>

              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                [class.bg-primary-50]="isCurrentRoute('/boards')"
                (clicked)="navigateTo('/boards')"
                class="justify-start"
              >
                <lucide-icon name="folder" class="w-4 h-4 mr-3"></lucide-icon>
                Boards
              </app-button>

              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                [class.bg-primary-50]="isCurrentRoute('/projects')"
                (clicked)="navigateTo('/projects')"
                class="justify-start"
              >
                <lucide-icon
                  name="briefcase"
                  class="w-4 h-4 mr-3"
                ></lucide-icon>
                Projects
              </app-button>

              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                [class.bg-primary-50]="isCurrentRoute('/teams')"
                (clicked)="navigateTo('/teams')"
                class="justify-start"
              >
                <lucide-icon name="users" class="w-4 h-4 mr-3"></lucide-icon>
                Teams
              </app-button>
            </div>

            <!-- Mobile Search -->
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <lucide-icon
                    name="search"
                    class="h-5 w-5 text-gray-400"
                  ></lucide-icon>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  [(ngModel)]="searchQuery"
                  (keyup.enter)="onSearch()"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Quick Create Modal -->
      <div
        *ngIf="showQuickCreateModal()"
        class="fixed inset-0 z-50 overflow-y-auto"
        (click)="closeQuickCreate()"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            (click)="$event.stopPropagation()"
          >
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Quick Create
            </h3>

            <div class="space-y-2">
              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                (clicked)="quickCreateBoard()"
                class="justify-start"
              >
                <lucide-icon
                  name="folder-plus"
                  class="w-4 h-4 mr-3"
                ></lucide-icon>
                New Board
              </app-button>

              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                (clicked)="quickCreateTask()"
                class="justify-start"
              >
                <lucide-icon
                  name="plus-square"
                  class="w-4 h-4 mr-3"
                ></lucide-icon>
                New Task
              </app-button>

              <app-button
                variant="ghost"
                size="sm"
                [fullWidth]="true"
                (clicked)="quickCreateTeam()"
                class="justify-start"
              >
                <lucide-icon
                  name="user-plus"
                  class="w-4 h-4 mr-3"
                ></lucide-icon>
                New Team
              </app-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
    `,
  ],
})
export class MainLayoutComponent {
  private router = inject(Router);
  private store = inject(Store);
  private notificationService = inject(NotificationService);

  // Store selectors
  user = this.store.selectSignal(selectUser);
  isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  unreadCount = this.store.selectSignal(selectUnreadCount);

  //Lucide icons
  readonly SquareKanban = SquareKanban;

  // Local state
  currentRoute = signal('');
  searchQuery = signal('');
  showMobileMenu = signal(false);
  showNotificationsPanel = signal(false);
  showQuickCreateModal = signal(false);

  userMenuItems: DropdownItem[] = [
    { label: 'Your Profile', value: 'profile', icon: 'user' },
    { label: 'Settings', value: 'settings', icon: 'settings' },
    { separator: true, label: '', value: null },
    { label: 'Sign out', value: 'logout', icon: 'log-out' },
  ];

  constructor() {
    // Track current route
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
        this.showMobileMenu.set(false);
      });
  }

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.showMobileMenu.set(false);
  }

  isCurrentRoute(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update((value) => !value);
  }

  toggleNotifications(): void {
    this.showNotificationsPanel.update((value) => !value);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
    this.showNotificationsPanel.set(false);
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
    this.showNotificationsPanel.set(false);
  }

  showQuickCreate(): void {
    this.showQuickCreateModal.set(true);
  }

  closeQuickCreate(): void {
    this.showQuickCreateModal.set(false);
  }

  quickCreateBoard(): void {
    this.router.navigate(['/boards/new']);
    this.closeQuickCreate();
  }

  quickCreateTask(): void {
    this.router.navigate(['/tasks/new']);
    this.closeQuickCreate();
  }

  quickCreateTeam(): void {
    this.router.navigate(['/teams/new']);
    this.closeQuickCreate();
  }

  onUserMenuAction(action: string): void {
    switch (action) {
      case 'profile':
        this.router.navigate(['/profile']);
        break;
      case 'settings':
        this.router.navigate(['/settings']);
        break;
      case 'logout':
        this.store.dispatch(AuthActions.logout());
        break;
    }
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(
      0
    )}`.toUpperCase();
  }
}
