// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { UIStore } from '@store/ui.store';
// import { ToastComponent } from '@shared/components/toast/toast.component';

// @Component({
//   selector: 'app-toast-container',
//   standalone: true,
//   imports: [CommonModule, ToastComponent],
//   template: `
//     <div class="fixed top-4 right-4 z-50 space-y-2">
//       @for (toast of uiStore.toasts(); track toast.id) {
//       <app-toast
//         [variant]="toast.variant"
//         [title]="toast.title || ''"
//         [message]="toast.message"
//         [persistent]="toast.persistent || false"
//         (closed)="uiStore.removeToast(toast.id)"
//       ></app-toast>
//       }
//     </div>
//   `,
// })
// export class ToastContainerComponent {
//   uiStore = inject(UIStore);
// }
