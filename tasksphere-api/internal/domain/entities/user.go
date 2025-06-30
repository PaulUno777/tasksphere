package entities

import (
	"go.mongodb.org/mongo-driver/v2/bson"
)

type User struct {
	*Base `bson:",inline"`

	Email        string `bson:"email"`
	FirstName    string `bson:"firstName"`
	LastName     string `bson:"lastName"`
	PasswordHash string `bson:"passwordHash"`
	RefreshToken string `bson:"refreshToken,omitempty"`
	Language     string `bson:"language,omitempty"`
	IsActive     bool   `bson:"isActive"`

	Comments      []bson.ObjectID `bson:"comments,omitempty"`
	BoardMembers  []bson.ObjectID `bson:"boardMembers,omitempty"`
	Notifications []bson.ObjectID `bson:"notifications,omitempty"`
}

func (u *User) GetFullName() string {
	return u.FirstName + " " + u.LastName
}
