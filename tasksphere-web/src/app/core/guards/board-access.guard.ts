import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { BoardsStore } from '@store/boards.store';
import { BoardService } from '@core/services/board.service';

export const boardAccessGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const boardsStore = inject(BoardsStore);
  const boardService = inject(BoardService);
  const router = inject(Router);
  const boardId = route.paramMap.get('id');

  if (!boardId) {
    router.navigate(['/boards']);
    return false;
  }

  try {
    // Try to load the specific board to verify access
    const board = await boardService.getBoardById(boardId);
    
    // Check if user has permission to access this board
    if (!board || !['OWNER', 'ADMIN', 'MEMBER', 'GUEST'].includes(board.userRole)) {
      router.navigate(['/boards']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Board access check failed:', error);
    router.navigate(['/boards']);
    return false;
  }
};