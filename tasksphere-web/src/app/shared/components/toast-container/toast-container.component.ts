import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: "./toast-container.component.html"
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  // Icons
  protected readonly X = X;
  protected readonly CheckCircle = CheckCircle;
  protected readonly AlertCircle = AlertCircle;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Info = Info;

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}