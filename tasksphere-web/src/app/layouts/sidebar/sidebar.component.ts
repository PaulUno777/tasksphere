// import { Component, computed, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink, RouterLinkActive, Router } from '@angular/router';
// import {
//   LucideAngularModule,
//   Home,
//   FolderOpen,
//   CheckSquare,
//   Users,
//   Plus,
//   Archive,
//   Settings,
// } from 'lucide-angular';
// import { AuthStore } from '@store/auth.store';
// import { BoardStore } from '@store/board.store';

// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
//   template: `
//     <aside
//       class="fixed left-0 top-16 z-40 w-64 h-full bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out"
//     >
//       <div class="flex flex-col h-full">
//         <!-- Navigation -->
//         <nav class="flex-1 px-4 py-6 space-y-2">
//           <!-- Main navigation -->
//           <div class="space-y-1">
//             <a
//               routerLink="/dashboard"
//               routerLinkActive="bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//               class="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
//             >
//               <lucide-icon [img]="Home" size="18" class="mr-3" />
//               Dashboard
//             </a>

//             <a
//               routerLink="/my-tasks"
//               routerLinkActive="bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//               class="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
//             >
//               <lucide-icon [img]="CheckSquare" size="18" class="mr-3" />
//               My Tasks
//             </a>
//           </div>

//           <!-- Boards section -->
//           <div class="pt-6">
//             <div class="flex items-center justify-between px-3 py-2">
//               <h3
//                 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
//               >
//                 Boards
//               </h3>
//               <button
//                 type="button"
//                 class="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
//                 (click)="createBoard()"
//                 title="Create new board"
//               >
//                 <lucide-icon [img]="Plus" size="14" />
//               </button>
//             </div>

//             <div class="space-y-1">
//               @for (board of boardStore.boards(); track board.id) {
//               @if(board.status === 'ACTIVE') {
//               <a
//                 [routerLink]="['/boards', board.id]"
//                 routerLinkActive="bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 class="flex items-center px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
//               >
//                 <div
//                   class="w-4 h-4 rounded mr-3 flex-shrink-0"
//                   [style.background-color]="board.color || '#673ab7'"
//                 ></div>
//                 <span class="flex-1 truncate">{{ board.title }}</span>
//                 @if (board.userRole === 'OWNER') {
//                 <span class="text-xs text-neutral-400 ml-2">Owner</span>
//                 }
//               </a>
//               } } @if (boardStore.boards().filter(b => b.status
//               ==='ACTIVE').length === 0) {
//               <div class="px-3 py-4 text-center">
//                 <p class="text-sm text-neutral-500 dark:text-neutral-400">
//                   No boards yet
//                 </p>
//                 <button
//                   type="button"
//                   class="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
//                   (click)="createBoard()"
//                 >
//                   Create your first board
//                 </button>
//               </div>
//               }
//             </div>
//           </div>

//           <!-- Archived boards -->
//           @if (archivedBoardsCount() > 0) {
//           <div class="pt-4">
//             <button
//               type="button"
//               class="flex items-center w-full px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
//               (click)="toggleArchivedBoards()"
//             >
//               <lucide-icon [img]="Archive" size="16" class="mr-3" />
//               Archived ({{ archivedBoardsCount() }})
//             </button>

//             @if (showArchivedBoards()) {
//             <div class="ml-6 space-y-1">
//               @for (board of boardStore.boards(); track board.id) { @if
//               (board.status === 'ARCHIVED') {
//               <a
//                 [routerLink]="['/boards', board.id]"
//                 class="flex items-center px-3 py-2 text-sm text-neutral-500 dark:text-neutral-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
//               >
//                 <div
//                   class="w-3 h-3 rounded mr-3 flex-shrink-0 opacity-50"
//                   [style.background-color]="board.color || '#673ab7'"
//                 ></div>
//                 <span class="flex-1 truncate">{{ board.title }}</span>
//               </a>
//               } }
//             </div>
//             }
//           </div>
//           }
//         </nav>

//         <!-- Footer -->
//         <div class="p-4 border-t border-neutral-200 dark:border-neutral-700">
//           <div class="flex items-center space-x-3">
//             @if (authStore.user()?.avatarUrl) {
//             <img
//               [src]="authStore.user()?.avatarUrl"
//               [alt]="authStore.userFullName()"
//               class="h-8 w-8 rounded-full"
//             />
//             } @else {
//             <div
//               class="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium"
//             >
//               {{ authStore.userInitials() }}
//             </div>
//             }
//             <div class="flex-1 min-w-0">
//               <p
//                 class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate"
//               >
//                 {{ authStore.user()?.firstName }}
//                 {{ authStore.user()?.lastName }}
//               </p>
//               <p
//                 class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
//               >
//                 {{ authStore.user()?.email }}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </aside>
//   `,
// })
// export class SidebarComponent {
//   protected readonly authStore = inject(AuthStore);
//   protected readonly boardStore = inject(BoardStore);
//   private readonly router = inject(Router);

//   // Icons
//   protected readonly Home = Home;
//   protected readonly FolderOpen = FolderOpen;
//   protected readonly CheckSquare = CheckSquare;
//   protected readonly Users = Users;
//   protected readonly Plus = Plus;
//   protected readonly Archive = Archive;
//   protected readonly Settings = Settings;

//   // Component state
//   protected readonly showArchivedBoards = signal(false);

//   readonly activeBoards = computed(() =>
//     this.boardStore.boards().filter((b) => b.status === 'ACTIVE')
//   );

//   readonly archivedBoards = computed(() =>
//     this.boardStore.boards().filter((b) => b.status === 'ARCHIVED')
//   );

//   // Computed properties
//   protected readonly archivedBoardsCount = this.boardStore.archivedBoardsCount;

//   constructor() {
//     // Load user's boards on component initialization
//     this.boardStore.loadBoards({ status: 'ACTIVE' });
//   }

//   toggleArchivedBoards(): void {
//     this.showArchivedBoards.update((show) => !show);

//     if (this.showArchivedBoards()) {
//       // Load archived boards if not already loaded
//       this.boardStore.loadBoards({ status: 'ARCHIVED' });
//     }
//   }

//   createBoard(): void {
//     this.router.navigate(['/boards/new']);
//   }
// }
