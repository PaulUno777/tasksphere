import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthActions } from './auth.actions';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { User } from '../../core/models';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private websocketService = inject(WebSocketService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((user) => AuthActions.loginSuccess({ user })),
          catchError((error) =>
            of(
              AuthActions.loginFailure({
                error: error.error?.error || 'Login failed',
              })
            )
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.notificationService.showSuccess(
            'Welcome back!',
            'Successfully logged in'
          );
          this.websocketService.connect();
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ userData }) =>
        this.authService.register(userData).pipe(
          map((user) => AuthActions.registerSuccess({ user })),
          catchError((error) =>
            of(
              AuthActions.registerFailure({
                error: error.error?.error || 'Registration failed',
              })
            )
          )
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => {
          this.notificationService.showSuccess(
            'Account created!',
            'Welcome to TaskTphere'
          );
          this.websocketService.connect();
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.authService.logout();
        this.websocketService.disconnect();
        this.notificationService.clearAllNotifications();
        this.notificationService.showInfo('Logged out', 'See you next time!');
      }),
      map(() => AuthActions.logoutSuccess())
    )
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      exhaustMap(() =>
        this.authService.loadCurrentUser().pipe(
          map((user) =>
            AuthActions.loadCurrentUserSuccess({ user: user as User })
          ),
          catchError((error) =>
            of(
              AuthActions.loadCurrentUserFailure({
                error: error.error?.error || 'Failed to load user',
              })
            )
          )
        )
      )
    )
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateProfile),
      exhaustMap(({ userData }) =>
        this.authService.updateProfile(userData).pipe(
          map((user) => AuthActions.updateProfileSuccess({ user })),
          catchError((error) =>
            of(
              AuthActions.updateProfileFailure({
                error: error.error?.error || 'Profile update failed',
              })
            )
          )
        )
      )
    )
  );

  updateProfileSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.updateProfileSuccess),
        tap(() => {
          this.notificationService.showSuccess(
            'Profile updated',
            'Your changes have been saved'
          );
        })
      ),
    { dispatch: false }
  );

  authError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthActions.loginFailure,
          AuthActions.registerFailure,
          AuthActions.updateProfileFailure
        ),
        tap(({ error }) => {
          this.notificationService.showError('Error', error);
        })
      ),
    { dispatch: false }
  );
}
