import { inject, Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { Category } from '@core/models';
import {
  CreateCategoryRequest,
  UpdateCategoryPositionRequest,
  UpdateCategoryRequest,
} from '@core/types';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly httpClient = inject(HttpClientService);

  // Get board categories
  getBoardCategories(
    boardId: string,
    params = {}
  ): Promise<{ categories: Category[] }> {
    return this.httpClient.get<{ categories: Category[] }>(
      `/api/v1/boards/${boardId}/categories`,
      params
    );
  }

  // Get single category
  getCategory(categoryId: string): Promise<Category> {
    return this.httpClient.get<Category>(`/api/v1/categories/${categoryId}`);
  }

  // Create category
  createCategory(
    boardId: string,
    categoryData: CreateCategoryRequest
  ): Promise<Category> {
    return this.httpClient.post<Category>(
      `/api/v1/boards/${boardId}/categories`,
      categoryData
    );
  }

  // Update category
  updateCategory(
    categoryId: string,
    updates: UpdateCategoryRequest
  ): Promise<Category> {
    return this.httpClient.put<Category>(
      `/api/v1/categories/${categoryId}`,
      updates
    );
  }

  // Update category position
  updateCategoryPosition(
    categoryId: string,
    positionData: UpdateCategoryPositionRequest
  ): Promise<Category> {
    return this.httpClient.put<Category>(
      `/api/v1/categories/${categoryId}/position`,
      positionData
    );
  }

  // Toggle category active status
  toggleCategoryActive(categoryId: string): Promise<void> {
    return this.httpClient.put<void>(
      `/api/v1/categories/${categoryId}/toggle-active`,
      {}
    );
  }

  // Delete category
  deleteCategory(categoryId: string): Promise<void> {
    return this.httpClient.delete<void>(`/api/v1/categories/${categoryId}`);
  }
}
