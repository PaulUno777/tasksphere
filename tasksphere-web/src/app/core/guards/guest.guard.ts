import { inject, Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthStore } from '@store/auth.store';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): boolean {
    if (!this.authStore.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
