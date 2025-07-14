import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { AuthStore } from '@store/auth.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  template: `
    <!-- Main Application -->
    <router-outlet />
    
    <!-- Global Toast Notifications -->
    <app-toast />
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class App {
  private readonly authStore = inject(AuthStore);

  async ngOnInit(): Promise<void> {
    // Initialize authentication state
    await this.authStore.initializeAuth();
  }
}
