package entities

import (
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardMember struct {
	Base `bson:",inline"`

	UserID  bson.ObjectID `bson:"userId" json:"userId" validate:"required"`
	BoardID bson.ObjectID `bson:"boardId" json:"boardId" validate:"required"`
	Role    BoardRole     `bson:"role" json:"role" validate:"required,oneof=ADMIN EDITOR VIEWER"`
}

func (bm *BoardMember) IsAdmin() bool {
	return bm.Role == "ADMIN"
}

func (bm *BoardMember) CanEdit() bool {
	return bm.Role == "ADMIN" || bm.Role == "EDITOR"
}

func (bm *BoardMember) CanView() bool {
	return bm.Role == "ADMIN" || bm.Role == "EDITOR" || bm.Role == "VIEWER"
}
