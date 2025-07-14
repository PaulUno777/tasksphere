import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { boardAccessGuard } from '@core/guards/board-access.guard';

export const boardsRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./pages/board-list/board-list').then(
            (c) => c.BoardListComponent
          ),
        title: 'Boards - TaskSphere',
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/board-create/board-create-page').then(
            (c) => c.BoardCreatePageComponent
          ),
        title: 'Create Board - TaskSphere',
      },
      {
        path: ':id',
        canActivate: [boardAccessGuard],
        loadComponent: () =>
          import('./pages/board-detail/board-detail.component').then(c => c.BoardDetailComponent),
        title: 'Board Details - TaskSphere'
      },
      {
        path: ':id/settings',
        canActivate: [boardAccessGuard],
        loadComponent: () =>
          import('./pages/board-settings-page/board-settings-page').then(
            (c) => c.BoardSettingsPageComponent
          ),
        title: 'Board Settings - TaskSphere',
      },
      {
        path: ':id/members',
        canActivate: [boardAccessGuard],
        loadComponent: () =>
          import('./pages/board-members-page/board-members-page').then(
            (c) => c.BoardMembersPageComponent
          ),
        title: 'Board Members - TaskSphere',
      },
    ],
  },
];
