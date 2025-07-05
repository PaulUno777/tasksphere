package category

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
)

// mapCategoryToResponse maps category entity to response DTO
func (uc *UseCase) mapCategoryToResponse(category *entities.Category, creator *entities.User, taskCount int) *dto.CategoryResponse {
	return &dto.CategoryResponse{
		ID:          category.GetID(),
		Name:        category.Name,
		Description: category.Description,
		Color:       category.Color,
		Position:    category.Position,
		IsActive:    category.IsActive,
		CreatedBy:   uc.mapUserToResponse(creator),
		TaskCount:   taskCount,
		CreatedAt:   category.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   category.UpdatedAt.Format(time.RFC3339),
	}
}

func (uc *UseCase) mapUserToResponse(user *entities.User) *dto.UserMinimal {
	return &dto.UserMinimal{
		ID:        user.GetID(),
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
	}
}
