package domain

import (
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardMember struct {
	BaseEntity `bson:",inline"`

	UserID  bson.ObjectID `bson:"userId" json:"userId"`
	Role    BoardRole     `bson:"role" json:"role"`
	BoardID bson.ObjectID `bson:"boardId" json:"boardId"`
}
