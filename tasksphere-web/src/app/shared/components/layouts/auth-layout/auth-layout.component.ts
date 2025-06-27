import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, SquareKanban } from 'lucide-angular';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  template: `<header class="bg-primary-600 text-white px-6 py-4 shadow-md">
      <h1 class="text-xl font-semibold flex gap-2">
        <lucide-icon
          [img]="SquareKanban"
          class="h-8 w-8 text-primary-600 bg-white rounded-md"
        ></lucide-icon
        >TaskSphere
      </h1>
    </header>

    <div class="flex justify-center items-center mt-auto bg-gray-100">
      <router-outlet></router-outlet>
    </div> `,
})
export class AuthLayoutComponent {
  readonly SquareKanban = SquareKanban;
}
