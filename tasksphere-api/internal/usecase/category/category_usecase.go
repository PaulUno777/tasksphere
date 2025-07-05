package category

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// UseCase handles category business logic
type UseCase struct {
	boardMemberRepo repositories.BoardMemberRepository
	categoryRepo    repositories.CategoryRepository
	boardRepo       repositories.BoardRepository
	taskRepo        repositories.TaskRepository
	userRepo        repositories.UserRepository
	i18n            services.I18nService
}

// NewUseCase creates a new category use case
func NewUseCase(
	boardMemberRepo repositories.BoardMemberRepository,
	categoryRepo repositories.CategoryRepository,
	boardRepo repositories.BoardRepository,
	taskRepo repositories.TaskRepository,
	userRepo repositories.UserRepository,
) *UseCase {
	return &UseCase{

		boardMemberRepo: boardMemberRepo,
		categoryRepo:    categoryRepo,
		boardRepo:       boardRepo,
		taskRepo:        taskRepo,
		userRepo:        userRepo,
		i18n:            i18n.Get(),
	}
}

// CreateCategory creates a new category
func (uc *UseCase) CreateCategory(ctx context.Context, userID, boardID bson.ObjectID, req *dto.CreateCategoryRequest, lang string) (*dto.CategoryResponse, error) {
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewForbiddenError(
			uc.i18n.T(lang, "errors.insufficient_permissions"),
		)
	}
	// Check if user can manage categories (admin/owner)
	if !member.IsAdmin() {
		return nil, errors.NewForbiddenError(
			uc.i18n.T(lang, "errors.insufficient_permissions"),
		)
	}
	// Get board to check if it can be modified
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(
			uc.i18n.T(lang, "errors.board_not_found"))
	}
	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(
			uc.i18n.T(lang, "errors.board_cannot_be_modified"))
	}
	// Check if category name is available
	available, err := uc.categoryRepo.IsNameAvailable(ctx, boardID, req.Name, nil)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}
	if !available {
		return nil, errors.NewConflictError(
			uc.i18n.T(lang, "errors.category_name_exists"))
	}
	// Get next position
	maxPosition, err := uc.categoryRepo.GetMaxPosition(ctx, boardID)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}
	// Create category entity
	category := &entities.Category{
		Base:        entities.NewBase(),
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		BoardID:     boardID,
		CreatedBy:   userID,
		Position:    maxPosition + 1,
		IsActive:    true,
	}
	// Save category
	if err := uc.categoryRepo.Create(ctx, category); err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}
	// Get creator info
	creator, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapCategoryToResponse(category, creator, 0), nil
}

func (uc *UseCase) GetCategory(ctx context.Context, userID bson.ObjectID, categoryID bson.ObjectID, lang string) (*dto.CategoryResponse, error) {
	// Get category
	category, err := uc.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, category.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}
	// Get creator info
	creator, err := uc.userRepo.GetByID(ctx, category.CreatedBy)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}
	// Get task count
	taskCount, _ := uc.taskRepo.CountByCategory(ctx, categoryID)

	return uc.mapCategoryToResponse(category, creator, int(taskCount)), nil
}

func (uc *UseCase) GetBoardCategories(ctx context.Context, userID bson.ObjectID, boardID bson.ObjectID, includeInactive bool, lang string) (*dto.CategoryListResponse, error) {
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.board_not_found"))
	}

	// Get categories with task count
	categoriesWithCount, err := uc.categoryRepo.GetCategoriesWithTaskCount(ctx, boardID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Convert to response DTOs
	categoryResponses := make([]*dto.CategoryResponse, 0, len(categoriesWithCount))
	for _, catWithCount := range categoriesWithCount {
		// Filter inactive categories if not requested
		if !includeInactive && !catWithCount.Category.IsActive {
			continue
		}

		// Get creator info
		creator, err := uc.userRepo.GetByID(ctx, catWithCount.Category.CreatedBy)
		if err != nil {
			continue // Skip if creator not found
		}

		response := uc.mapCategoryToResponse(catWithCount.Category, creator, int(catWithCount.TaskCount))
		categoryResponses = append(categoryResponses, response)
	}

	return &dto.CategoryListResponse{
		Categories: categoryResponses,
	}, nil
}

// UpdateCategory updates a category
func (uc *UseCase) UpdateCategory(ctx context.Context, userID bson.ObjectID, categoryID bson.ObjectID, req *dto.UpdateCategoryRequest, lang string) (*dto.CategoryResponse, error) {
	// Get category
	category, err := uc.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}
	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, category.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}
	if !member.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}
	if !category.IsUsable() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.category_not_active"))
	}
	// Check board can be modified
	board, err := uc.boardRepo.GetByID(ctx, category.BoardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.board_not_found"))
	}
	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.board_cannot_be_modified"))
	}
	// Update fields
	if req.Name != nil {
		// Check if new name is available
		available, err := uc.categoryRepo.IsNameAvailable(ctx, category.BoardID, *req.Name, &categoryID)
		if err != nil {
			return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
		}
		if !available {
			return nil, errors.NewConflictError(uc.i18n.T(lang, "errors.category_name_exists"))
		}
		category.UpdateName(*req.Name)
	}

	if req.Description != nil {
		category.UpdateDescription(req.Description)
	}

	if req.Color != nil {
		category.UpdateColor(*req.Color)
	}

	// Save category
	if err := uc.categoryRepo.Update(ctx, category); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get creator info
	creator, err := uc.userRepo.GetByID(ctx, category.CreatedBy)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get task count
	taskCount, _ := uc.taskRepo.CountByCategory(ctx, categoryID)

	return uc.mapCategoryToResponse(category, creator, int(taskCount)), nil
}

// UpdateCategoryPosition updates category position
func (uc *UseCase) UpdateCategoryPosition(ctx context.Context, userID bson.ObjectID, categoryID bson.ObjectID, req *dto.UpdateCategoryPositionRequest, lang string) (*dto.CategoryResponse, error) {
	// Get category
	category, err := uc.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, category.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}

	if !member.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if !category.IsUsable() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.category_not_active"))
	}

	// Update position
	if err := uc.categoryRepo.UpdatePosition(ctx, categoryID, req.Position); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated category
	updatedCategory, err := uc.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get creator info
	creator, err := uc.userRepo.GetByID(ctx, category.CreatedBy)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get task count
	taskCount, _ := uc.taskRepo.CountByCategory(ctx, categoryID)

	return uc.mapCategoryToResponse(updatedCategory, creator, int(taskCount)), nil
}

// DeleteCategory deletes a category (hard delete)
func (uc *UseCase) DeleteCategory(ctx context.Context, userID bson.ObjectID, categoryID bson.ObjectID, lang string) error {
	// Get category
	category, err := uc.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, category.BoardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}

	if !member.IsAdmin() {
		return errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	// Check if category has tasks
	taskCount, err := uc.taskRepo.CountByCategory(ctx, categoryID)
	if err != nil {
		return errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	if taskCount > 0 {
		return errors.NewBadRequestError(uc.i18n.T(lang, "errors.category_has_tasks"))
	}

	// Delete category
	if err := uc.categoryRepo.Delete(ctx, categoryID); err != nil {
		return errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *UseCase) ToggleActiveStatus(ctx context.Context, userID bson.ObjectID, categoryID bson.ObjectID, lang string) (*bool, error) {
	// Get category
	category, err := uc.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, category.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.category_not_found"))
	}

	if !member.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if category.IsActive {
		category.Deactivate()

	} else {
		category.Activate()
	}
	if err := uc.categoryRepo.Update(ctx, category); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return &category.IsActive, nil
}
