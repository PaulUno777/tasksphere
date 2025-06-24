package auth

import (
	"errors"

	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"github.com/PaulUno777/tasksphere-api/pkg/crypto"
	"github.com/PaulUno777/tasksphere-api/pkg/jwt"
)

type authUseCase struct {
	userRepo domain.UserRepository
}

func NewAuthUseCase(repo domain.UserRepository) AuthUseCase {
	return &authUseCase{userRepo: repo}
}

func (uc *authUseCase) Register(input RegisterInput) (*AuthResponse, error) {
	existing, _ := uc.userRepo.FindByEmail(input.Email)
	if existing != nil {
		return nil, errors.New("email already in use")
	}

	hashedPassword, _ := crypto.HashPassword(input.Password)

	user := &domain.User{
		Email:        input.Email,
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		PasswordHash: string(hashedPassword),
	}

	if err := uc.userRepo.Create(user); err != nil {
		return nil, err
	}

	if user, err := uc.userRepo.FindByEmail(user.Email); err != nil {
		return nil, err
	} else {
		return uc.buildAuthResponse(user)
	}

}

func (uc *authUseCase) Login(input LoginInput) (*AuthResponse, error) {
	user, err := uc.userRepo.FindByEmail(input.Email)
	if err != nil || user == nil {
		return nil, errors.New("invalid credentials")
	}

	if check := crypto.CompareHashed(input.Password, user.PasswordHash); !check {
		return nil, errors.New("invalid credentials")
	}

	return uc.buildAuthResponse(user)
}

func (uc *authUseCase) RefreshToken(token string) (*TokenPair, error) {
	payload, err := jwt.VerifyRefreshToken(token)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	user, err := uc.userRepo.FindByID(payload.UserID)
	if err != nil || user.RefreshToken == nil || *user.RefreshToken != token {
		return nil, errors.New("unauthorized")
	}

	tokens := jwt.GenerateTokens(user.ID.Hex(), user.Email)

	// update token
	_ = uc.userRepo.UpdateRefreshToken(user.ID.Hex(), &tokens.RefreshToken)

	return &TokenPair{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}, nil
}

func (uc *authUseCase) buildAuthResponse(user *domain.User) (*AuthResponse, error) {
	tokens := jwt.GenerateTokens(user.ID.Hex(), user.Email)
	_ = uc.userRepo.UpdateRefreshToken(user.ID.Hex(), &tokens.RefreshToken)

	return &AuthResponse{
		User:         user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}, nil
}
