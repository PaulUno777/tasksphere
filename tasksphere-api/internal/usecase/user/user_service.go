package auth

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"github.com/PaulUno777/tasksphere-api/pkg/crypto"
)

type userUseCase struct {
	userRepo domain.UserRepository
}

func NewUserUseCase(repo domain.UserRepository) UserUseCase {
	return &userUseCase{userRepo: repo}
}

func (uc *userUseCase) GetProfile(user *domain.User) *domain.User {

	return user
}

func (uc *userUseCase) UpdateProfile(id string, input UpdateProfileInput) (*domain.User, error) {
	user, err := uc.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if input.FirstName != "" {
		user.FirstName = input.FirstName
	}
	if input.LastName != "" {
		user.LastName = input.LastName
	}
	if input.Password != "" {
		hashed, err := crypto.HashPassword(input.Password)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = string(hashed)
	}
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}
