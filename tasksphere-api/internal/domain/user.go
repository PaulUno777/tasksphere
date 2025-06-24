package domain

import "go.mongodb.org/mongo-driver/v2/bson"

type User struct {
	BaseEntity `bson:",inline"`

	Email        string  `bson:"email" json:"email"`
	FirstName    string  `bson:"firstName" json:"firstName"`
	LastName     string  `bson:"lastName" json:"lastName"`
	PasswordHash string  `bson:"passwordHash" json:"-"`
	RefreshToken *string `bson:"refreshToken,omitempty" json:"_,omitempty"`

	Comments      []bson.ObjectID `bson:"comments,omitempty" json:"comments,omitempty"`
	BoardMembers  []bson.ObjectID `bson:"boardMembers,omitempty" json:"boardMembers,omitempty"`
	Notifications []bson.ObjectID `bson:"notifications,omitempty" json:"notifications,omitempty"`
}
