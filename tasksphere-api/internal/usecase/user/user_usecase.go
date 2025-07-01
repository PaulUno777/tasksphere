package user

import (
	"context"
	"fmt"

	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UseCase struct {
	userRepo    repositories.UserRepository
	authService services.AuthService
	localizer   services.I18nService
}

func NewUseCase(
	userRepo repositories.UserRepository,
	authService services.AuthService,
	localizer services.I18nService,
) *UseCase {
	return &UseCase{
		userRepo:    userRepo,
		authService: authService,
		localizer:   localizer,
	}
}

func (uc *UseCase) GetProfile(ctx context.Context, userID bson.ObjectID, lang string) (*dto.UserProfile, error) {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewNotFoundError(
			uc.localizer.T(lang, "errors.user_not_found"))
	}

	return dto.UserToProfile(user), nil
}

// UpdateProfile updates user profile
func (uc *UseCase) UpdateProfile(ctx context.Context, userID bson.ObjectID, req *dto.UpdateProfileRequest, lang string) (*dto.UserProfile, error) {
	// Get current user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewNotFoundError(
			uc.localizer.T(lang, "errors.user_not_found"))
	}
	
	// Prepare updates
	changed := false
	if req.FirstName != "" {
		user.FirstName = req.FirstName
		changed= true
	}
	if req.LastName != "" {
		user.LastName = req.LastName
		changed= true

	}
	if req.Language != "" {
		user.Language = req.Language
		changed= true

	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
		changed= true

	}

	if !changed {
		return dto.UserToProfile(user), nil
	}

	// Update user
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, errors.NewInternalServerError(
			uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get updated user
	updatedUser, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.localizer.T(lang, "errors.internal_error"), err)
	}

	fmt.Printf("req %v", updatedUser)

	return dto.UserToProfile(updatedUser), nil
}

// UpdatePassword updates user password
func (uc *UseCase) UpdatePassword(ctx context.Context, userID bson.ObjectID, req *dto.UpdatePasswordRequest, lang string) error {
	// Get current user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.NewNotFoundError(
			uc.localizer.T(lang, "errors.user_not_found"))
	}

	// Verify current password
	if err := uc.authService.VerifyPassword(user.PasswordHash, req.CurrentPassword); err != nil {
		return errors.NewBadRequestError(
			uc.localizer.T(lang, "errors.invalid_current_password"))
	}

	// Hash new password
	newPasswordHash, err := uc.authService.HashPassword(req.NewPassword)
	if err != nil {
		return errors.NewInternalServerError(
			uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Update password
	user.PasswordHash = newPasswordHash
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return errors.NewInternalServerError(
			uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return nil
}
