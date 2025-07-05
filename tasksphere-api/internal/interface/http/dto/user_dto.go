package dto

type UpdateProfileRequest struct {
	FirstName string `json:"firstName,omitempty" validate:"omitempty,min=2,max=50"`
	LastName  string `json:"lastName,omitempty" validate:"omitempty,min=2,max=50"`
	Language  string `json:"language,omitempty" validate:"omitempty,oneof=en fr"`
	AvatarURL string `json:"avatarUrl" validate:"omitempty,url"`
}

type UserMinimal struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	AvatarURL string `json:"avatarUrl,omitempty"`
}

// UserResponse represents user data in responses
type UserResponse struct {
	ID              string `json:"id"`
	Email           string `json:"email"`
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	FullName        string `json:"fullName"`
	Language        string `json:"language,omitempty"`
	AvatarURL       string `json:"avatarUrl,omitempty"`
	IsActive        bool   `json:"isActive"`
	IsEmailVerified bool   `json:"isEmailVerified"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}
