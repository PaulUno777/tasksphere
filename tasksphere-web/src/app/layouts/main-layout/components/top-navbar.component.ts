// import { Component, inject, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { LucideAngularModule } from 'lucide-angular';
// import {
//   Menu,
//   Search,
//   Bell,
//   Plus,
//   Settings,
//   LogOut,
//   User,
//   ChevronDown,
//   X,
// } from 'lucide-angular';

// import { AuthStore } from '@store/auth.store';
// import { UIStore } from '@store/ui.store';
// import { AvatarComponent } from '@shared/components/avatar/avatar.component';
// import { ButtonComponent } from '@shared/components/button/button.component';
// import {
//   DropdownComponent,
//   DropdownItem,
// } from '@shared/components/dropdown/dropdown.component';
// import { ThemeToggleComponent } from '@shared/components/theme-toggle/theme-toggle.component';
// import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

// @Component({
//   selector: 'app-top-navbar',
//   standalone: true,
//   imports: [
//     CommonModule,
//     LucideAngularModule,
//     AvatarComponent,
//     ButtonComponent,
//     DropdownComponent,
//     ThemeToggleComponent,
//     FormFieldComponent,
//   ],
//   template: `
//     <header
//       class="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border-default h-16"
//     >
//       <div class="flex items-center justify-between h-full px-4">
//         <!-- Left Section -->
//         <div class="flex items-center space-x-4">
//           <!-- Mobile Menu Toggle -->
//           <app-button
//             variant="ghost"
//             size="sm"
//             [leftIcon]="uiStore.mobileMenuOpen() ? X : Menu"
//             (clicked)="toggleMobileMenu()"
//             class="lg:hidden"
//           ></app-button>

//           <!-- Desktop Sidebar Toggle -->
//           <app-button
//             variant="ghost"
//             size="sm"
//             [leftIcon]="Menu"
//             (clicked)="uiStore.toggleSidebar()"
//             class="hidden lg:flex"
//           ></app-button>

//           <!-- Logo -->
//           <div class="flex items-center">
//             <h1 class="text-xl font-bold text-primary-600">TaskSphere</h1>
//           </div>

//           <!-- Search Bar (Desktop) -->
//           <div class="hidden md:block w-96">
//             <app-form-field
//               placeholder="Search tasks, boards, or members..."
//               type="search"
//               [leftIcon]="Search"
//               size="sm"
//               variant="filled"
//             ></app-form-field>
//           </div>
//         </div>

//         <!-- Right Section -->
//         <div class="flex items-center space-x-2">
//           <!-- Search Button (Mobile) -->
//           <app-button
//             variant="ghost"
//             size="sm"
//             [leftIcon]="Search"
//             class="md:hidden"
//           ></app-button>

//           <!-- Create Button -->
//           <app-dropdown
//             [items]="createMenuItems"
//             [hasCustomTrigger]="true"
//             (itemSelected)="onCreateItemSelected($event)"
//           >
//             <app-button
//               slot="trigger"
//               variant="primary"
//               size="sm"
//               [leftIcon]="Plus"
//               content="Create"
//             ></app-button>
//           </app-dropdown>

//           <!-- Notifications -->
//           <div class="relative">
//             <app-button
//               variant="ghost"
//               size="sm"
//               [leftIcon]="Bell"
//             ></app-button>

//             <!-- Notification Badge -->
//             @if (notificationCount() > 0) {
//             <span
//               class="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center"
//             >
//               {{ notificationCount() > 9 ? '9+' : notificationCount() }}
//             </span>
//             }
//           </div>

//           <!-- Theme Toggle -->
//           <app-theme-toggle></app-theme-toggle>

//           <!-- User Menu -->
//           <app-dropdown
//             [items]="userMenuItems"
//             [hasCustomTrigger]="true"
//             (itemSelected)="onUserMenuItemSelected($event)"
//           >
//             <div
//               slot="trigger"
//               class="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
//             >
//               <app-avatar
//                 [src]="authStore.userAvatarUrl()"
//                 [name]="authStore.userFullName()"
//                 size="sm"
//               ></app-avatar>
//               <div class="hidden sm:block text-left">
//                 <div class="text-sm font-medium text-text-default">
//                   {{ authStore.userFullName() }}
//                 </div>
//                 <div class="text-xs text-text-muted">{{ currentRole() }}</div>
//               </div>
//               <lucide-icon
//                 [img]="ChevronDown"
//                 [size]="16"
//                 class="text-text-muted"
//               ></lucide-icon>
//             </div>
//           </app-dropdown>
//         </div>
//       </div>
//     </header>
//   `,
// })
// export class TopNavbarComponent {
//   // Icons
//   protected readonly Menu = Menu;
//   protected readonly X = X;
//   protected readonly Search = Search;
//   protected readonly Bell = Bell;
//   protected readonly Plus = Plus;
//   protected readonly Settings = Settings;
//   protected readonly LogOut = LogOut;
//   protected readonly User = User;
//   protected readonly ChevronDown = ChevronDown;

//   // Store injections
//   authStore = inject(AuthStore);
//   uiStore = inject(UIStore);

//   private router = inject(Router);

//   // Computed properties
//   notificationCount = computed(() => 5); // TODO: Implement from notifications store
//   currentRole = computed(() => 'Admin'); // TODO: Get from current board

//   // Dropdown menu items
//   createMenuItems: DropdownItem[] = [
//     { id: 'board', label: 'New Board', icon: undefined },
//     { id: 'task', label: 'New Task', icon: undefined },
//     { id: 'divider', label: '', divider: true },
//     { id: 'invite', label: 'Invite Members', icon: undefined },
//   ];

//   userMenuItems: DropdownItem[] = [
//     { id: 'profile', label: 'Profile Settings', icon: User },
//     { id: 'settings', label: 'Preferences', icon: Settings },
//     { id: 'divider', label: '', divider: true },
//     { id: 'logout', label: 'Sign Out', icon: LogOut },
//   ];

//   toggleMobileMenu() {
//     this.uiStore.toggleMobileMenu();
//   }

//   onCreateItemSelected(item: DropdownItem) {
//     switch (item.id) {
//       case 'board':
//         this.uiStore.openModal('createBoard');
//         break;
//       case 'task':
//         this.uiStore.openModal('createTask');
//         break;
//       case 'invite':
//         this.uiStore.openModal('inviteMembers');
//         break;
//     }
//   }

//   onUserMenuItemSelected(item: DropdownItem) {
//     switch (item.id) {
//       case 'profile':
//         this.uiStore.openModal('userProfile');
//         break;
//       case 'settings':
//         this.router.navigate(['/settings']);
//         break;
//       case 'logout':
//         this.authStore.logout();
//         break;
//     }
//   }
// }
