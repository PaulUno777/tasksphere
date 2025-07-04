package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"strings"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UseCase struct {
	userRepo     repositories.UserRepository
	authService  services.AuthService
	oauthService services.OAuthService
	i18n         services.I18nService
}

func NewUseCase(
	userRepo repositories.UserRepository,
	authService services.AuthService,
	oauthService services.OAuthService,
) *UseCase {
	return &UseCase{
		userRepo:     userRepo,
		authService:  authService,
		oauthService: oauthService,
		i18n:         i18n.Get(),
	}
}

// Register handles user registration
func (uc *UseCase) Register(ctx context.Context, req *dto.RegisterRequest, lang string) (*dto.AuthResponse, error) {
	// Check if user already exists
	exists, _ := uc.userRepo.GetByEmail(ctx, strings.ToLower(req.Email))

	if exists != nil {
		return nil, errors.NewConflictError(
			uc.i18n.T(lang, "errors.email_already_exists"))
	}
	// Hash password
	hashedPassword, err := uc.authService.HashPassword(req.Password)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Set default language if not provided
	language := req.Language
	if language == "" {
		language = lang
	}

	// Create user entity
	user := &entities.User{
		Email:           strings.ToLower(req.Email),
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		PasswordHash:    hashedPassword,
		IsEmailVerified: false,
		IsActive:        true,
		Language:        language,
		Base:            entities.NewBase(),
	}

	// Save user
	if err = uc.userRepo.Create(ctx, user); err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Generate tokens
	accessToken, refreshToken, err := uc.authService.GenerateTokens(
		user.ID.Hex(),
		user.Email,
		user.Language,
	)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Save refresh token
	if err := uc.userRepo.UpdateRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Return response
	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *dto.UserToResponse(user),
	}, nil
}

// Login handles user login
func (uc *UseCase) Login(ctx context.Context, req *dto.LoginRequest, lang string) (*dto.AuthResponse, error) {
	// Get user by email
	user, err := uc.userRepo.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil || user == nil {

		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.invalid_credentials"),
		)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.account_deactivated"),
		)
	}

	// Verify password
	if err := uc.authService.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.invalid_credentials"),
		)
	}

	// Generate tokens
	accessToken, refreshToken, err := uc.authService.GenerateTokens(
		user.ID.Hex(),
		user.Email,
		user.Language)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.invalid_token"), err)
	}

	// Save refresh token
	if err := uc.userRepo.UpdateRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Return response
	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *dto.UserToResponse(user),
	}, nil
}

// RefreshToken handles token refresh
func (uc *UseCase) RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest, lang string) (*dto.AuthResponse, error) {
	// Validate refresh token
	claims, err := uc.authService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.invalid_token"))

	}

	// Get user
	user, err := uc.userRepo.GetByID(ctx, claims.UserID)
	if err != nil || user == nil {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.invalid_token"))
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.account_deactivated"))
	}

	// Check if refresh token matches
	if user.RefreshToken != req.RefreshToken {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.invalid_token"))
	}

	// Generate new tokens
	accessToken, refreshToken, err := uc.authService.GenerateTokens(
		user.ID.Hex(),
		user.Email,
		user.Language)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Save new refresh token
	if err := uc.userRepo.UpdateRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Return response
	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *dto.UserToResponse(user),
	}, nil
}

// GetGoogleAuthURL generates Google OAuth URL
func (uc *UseCase) GetGoogleAuthURL(ctx context.Context, lang string) (*dto.GoogleAuthURLResponse, error) {
	// Generate random state
	state, err := uc.generateState()
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	authURL := uc.oauthService.GetGoogleAuthURL(state)

	return &dto.GoogleAuthURLResponse{
		AuthURL: authURL,
		State:   state,
	}, nil
}

// GoogleAuth handles Google OAuth authentication
func (uc *UseCase) GoogleAuth(ctx context.Context, req *dto.GoogleAuthRequest, lang string) (*dto.AuthResponse, error) {
	// Exchange code for user info
	googleUser, err := uc.oauthService.ExchangeGoogleCode(ctx, req.Code)
	if err != nil {
		return nil, errors.NewBadRequestError(
			uc.i18n.T(lang, "errors.invalid_google_code"))
	}

	// Check if user exists
	user, err := uc.userRepo.GetByEmail(ctx, strings.ToLower(googleUser.Email))
	if err != nil || user == nil {
		// User doesn't exist, create new one
		language := req.Language
		if language == "" {
			language = "en"
		}
		user = &entities.User{
			Email:           strings.ToLower(googleUser.Email),
			FirstName:       googleUser.FirstName,
			LastName:        googleUser.LastName,
			IsEmailVerified: googleUser.EmailVerified,
			IsActive:        true,
			Language:        language,
			Base:            entities.NewBase(),
		}

		if err = uc.userRepo.Create(ctx, user); err != nil {
			return nil, errors.NewInternalServerError(
				uc.i18n.T(lang, "errors.internal_error"), err)
		}
	} else {
		// Update user info if needed
		updateCount := 0
		if user.AvatarURL != googleUser.Picture {
			user.AvatarURL = googleUser.Picture
			updateCount++
		}
		if !user.IsEmailVerified && googleUser.EmailVerified {
			user.IsEmailVerified = true
			updateCount++
		}

		if updateCount > 0 {
			if err := uc.userRepo.Update(ctx, user); err != nil {
				// Log error but don't fail authentication
			}
		}
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.NewUnauthorizedError(
			uc.i18n.T(lang, "errors.account_deactivated"))
	}

	// Generate tokens
	accessToken, refreshToken, err := uc.authService.GenerateTokens(
		user.ID.Hex(),
		user.Email,
		user.Language)
	if err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Save refresh token
	if err := uc.userRepo.UpdateRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, errors.NewInternalServerError(
			uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Return response
	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *dto.UserToResponse(user),
	}, nil
}

// Logout handles user logout
func (uc *UseCase) Logout(ctx context.Context, userID bson.ObjectID) error {
	// Clear refresh token
	if err := uc.userRepo.UpdateRefreshToken(ctx, userID, ""); err != nil {
		return errors.NewInternalServerError("Failed to logout", err)
	}
	return nil
}

// generateState generates a random state for OAuth
func (uc *UseCase) generateState() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
