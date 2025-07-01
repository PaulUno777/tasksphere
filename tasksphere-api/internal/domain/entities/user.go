package entities

type User struct {
	*Base `bson:",inline"`

	Email        string `bson:"email"`
	FirstName    string `bson:"firstName"`
	LastName     string `bson:"lastName"`
	PasswordHash string `bson:"passwordHash"`
	RefreshToken string `bson:"refreshToken,omitempty"`
	Language     string `bson:"language,omitempty"`
	AvatarURL    string `bson:"avatarURL,omitempty"`

	IsActive        bool `bson:"isActive"`
	IsEmailVerified bool `bson:"isEmailVerified"`
}

func (u *User) GetFullName() string {
	return u.FirstName + " " + u.LastName
}

func (u *User) IsValidLanguage(supportedLangs []string) bool {
	for _, lang := range supportedLangs {
		if u.Language == lang {
			return true
		}
	}
	return false
}
