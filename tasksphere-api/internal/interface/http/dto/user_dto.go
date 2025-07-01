package dto

type UpdateProfileRequest struct {
	FirstName string `json:"firstName,omitempty" validate:"omitempty,min=2,max=50"`
	LastName  string `json:"lastName,omitempty" validate:"omitempty,min=2,max=50"`
	Language  string `json:"language,omitempty" validate:"omitempty,oneof=en fr"`
	AvatarURL string `json:"avatarUrl" validate:"omitempty,url"`
}

// UserResponse represents user data in responses
type UserProfile struct {
	ID              string `json:"id"`
	Email           string `json:"email"`
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	Language        string `json:"language"`
	AvatarURL       string `json:"avatarUrl,omitempty"`
	IsEmailVerified bool   `json:"isEmailVerified"`
	CreatedAt       string `json:"createdAt"`
	UpdatedAt       string `json:"updatedAt"`
}
