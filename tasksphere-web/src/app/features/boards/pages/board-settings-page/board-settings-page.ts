// Location: src/app/features/boards/pages/board-settings-page/board-settings-page.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Loader2 } from 'lucide-angular';

import { BoardsStore } from '@store/boards.store';
import { BoardSettingsComponent } from '@features/boards/components/board-settings/board-settings.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner';
import { Board } from '@core/models';

@Component({
  selector: 'app-board-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BoardSettingsComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="min-h-screen bg-background">
      <!-- Page Header -->
      <header class="bg-surface border-b border-border-default sticky top-16 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Back Navigation -->
            <div class="flex items-center space-x-4">
              <button
                (click)="goBack()"
                class="flex items-center space-x-2 text-text-muted hover:text-text-default transition-colors"
              >
                <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
                <span class="text-sm font-medium">Back to Board</span>
              </button>
              
              @if (currentBoard()) {
                <div class="flex items-center space-x-2">
                  <div 
                    class="w-6 h-6 rounded-lg"
                    [style.background-color]="currentBoard()?.color || '#6b7280'"
                  ></div>
                  <span class="text-lg font-semibold text-text-default">
                    {{ currentBoard()?.title }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (isLoading()) {
          <div class="flex justify-center items-center h-64">
            <app-loading-spinner 
              [size]="'lg'" 
              [message]="'Loading board settings...'"
            ></app-loading-spinner>
          </div>
        } @else if (boardsStore.hasError()) {
          <div class="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
            <p class="text-danger-700 mb-4">{{ boardsStore.error() }}</p>
            <button
              (click)="retryLoading()"
              class="btn-primary btn-sm"
            >
              Retry
            </button>
          </div>
        } @else if (currentBoard()) {
          <app-board-settings 
            [board]="currentBoard()!"
          ></app-board-settings>
        }
      </main>
    </div>
  `,
})
export class BoardSettingsPageComponent implements OnInit {
  readonly ArrowLeft = ArrowLeft;
  readonly Loader2 = Loader2;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  boardsStore = inject(BoardsStore);

  boardId = signal<string>('');
  isLoading = signal(false);
  currentBoard = signal<Board | null>(null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/boards']);
      return;
    }

    this.boardId.set(id);
    await this.loadBoard();
  }

  private async loadBoard() {
    this.isLoading.set(true);
    
    try {
      await this.boardsStore.selectBoard(this.boardId());
      this.currentBoard.set(this.boardsStore.currentBoard());
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async retryLoading() {
    await this.loadBoard();
  }

  goBack() {
    this.router.navigate(['/boards', this.boardId()]);
  }
}