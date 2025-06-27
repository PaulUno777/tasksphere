import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '@shared/components/layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    //     canActivate: [AuthGuard],
    //     children: [
    //       {
    //         path: 'dashboard',
    //         loadChildren: () =>
    //           import('./features/dashboard/dashboard.routes').then(
    //             (m) => m.dashboardRoutes
    //           ),
    //       },
    //       {
    //         path: 'boards',
    //         loadChildren: () =>
    //           import('./features/boards/boards.routes').then((m) => m.boardsRoutes),
    //       },
    //       {
    //         path: 'profile',
    //         loadChildren: () =>
    //           import('./features/profile/profile.routes').then(
    //             (m) => m.profileRoutes
    //           ),
    //       },
    //       {
    //         path: 'notifications',
    //         loadComponent: () =>
    //           import(
    //             './features/notifications/pages/notifications/notifications.component'
    //           ).then((m) => m.NotificationsComponent),
    //       },
    //     ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
