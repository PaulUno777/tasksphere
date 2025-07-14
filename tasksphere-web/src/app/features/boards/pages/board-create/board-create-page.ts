import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateBoardModalComponent } from '../../components/create-board-modal/create-board-modal';
import { Board } from '@core/models';

@Component({
  selector: 'app-board-create-page',
  standalone: true,
  imports: [CreateBoardModalComponent],
  template: `
    <app-create-board-modal
      (boardCreated)="onBoardCreated($event)"
      (close)="onClose()"
    ></app-create-board-modal>
  `,
})
export class BoardCreatePageComponent {
  private router = inject(Router);

  onBoardCreated(board: Board) {
    this.router.navigate(['/boards', board.id]);
  }

  onClose() {
    this.router.navigate(['/boards']);
  }
}