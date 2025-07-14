import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then((m) => m.LoginComponent),
    title: 'Login - TaskSphere',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
    title: 'Register - TaskSphere',
  },
  {
    path: 'oauth/callback',
    loadComponent: () =>
      import('./oauth-callback/oauth-callback.component').then(
        (c) => c.OAuthCallbackComponent
      ),
    title: 'Authenticating - TaskSphere',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password').then(
        (c) => c.ForgotPasswordComponent
      ),
    title: 'Forgot Password - TaskSphere',
  },
];
