package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardMember struct {
	Base `bson:",inline"`

	UserID   bson.ObjectID `bson:"userId"`
	BoardID  bson.ObjectID `bson:"boardId"`
	Role     BoardRole     `bson:"role"`
	JoinedAt time.Time     `bson:"joinedAt"`
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
