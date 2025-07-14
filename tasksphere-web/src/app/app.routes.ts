import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { GuestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayoutComponent),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.dashboardRoutes
          ),
      },
      {
        path: 'boards',
        loadChildren: () =>
          import('./features/boards/boards.routes').then(
            (m) => m.boardsRoutes),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks.routes').then(
            (m) => m.tasksRoutes),
      },
      // {
      //   path: 'profile',
      //   loadChildren: () =>
      //     import('./features/profile/profile.routes').then(
      //       (m) => m.profileRoutes
      //     ),
      // },
      // {
      //   path: 'notifications',
      //   loadComponent: () =>
      //     import(
      //       './features/notifications/pages/notifications/notifications.component'
      //     ).then((m) => m.NotificationsComponent),
      // },
    ],
  },
  {
    path: '**',
    loadComponent: () => 
      import('./shared/pages/not-found/not-found').then(c => c.NotFoundComponent),
    title: 'Page Not Found - TaskSphere'
  },
];
