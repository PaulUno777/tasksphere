package dto

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

// CreateCategoryRequest represents category creation request
type CreateCategoryRequest struct {
	Name  string `json:"name" validate:"required,min=2,max=50"`
	Color string `json:"color" validate:"required,hexcolor"`
}

// UpdateCategoryRequest represents category update request
type UpdateCategoryRequest struct {
	Name  string `json:"name" validate:"omitempty,min=2,max=50"`
	Color string `json:"color" validate:"omitempty,hexcolor"`
}

// CategoryResponse represents category data in API responses
type CategoryResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"`
	BoardID   string `json:"boardId"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func CategoryToResponse(category *entities.Category) *CategoryResponse {
	if category == nil {
		return nil
	}
	return &CategoryResponse{
		ID:        category.GetID(),
		Name:      category.Name,
		Color:     category.Color,
		BoardID:   category.BoardID.Hex(),
		CreatedAt: category.CreatedAt.Format(time.RFC3339),
		UpdatedAt: category.UpdatedAt.Format(time.RFC3339),
	}
}
