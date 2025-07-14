import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

export const tasksRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'my-tasks',
        pathMatch: 'full',
      },
      {
        path: 'my-tasks',
        loadComponent: () =>
          import('./pages/tasks/tasks').then(
            (c) => c.TasksComponent
          ),
        title: 'My Tasks - TaskSphere',
      },
    ],
  },
];