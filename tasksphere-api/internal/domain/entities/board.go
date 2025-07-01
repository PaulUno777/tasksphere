package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Board struct {
	Base `bson:",inline"`

	Title       string        `bson:"title"`
	Description *string       `bson:"description,omitempty"`
	OwnerID     bson.ObjectID `bson:"ownerId"`

	Members []BoardMember `bson:"members,omitempty"`
}

func (b *Board) IsOwner(userID bson.ObjectID) bool {
	return b.OwnerID == userID
}

func (b *Board) GetMemberRole(userID bson.ObjectID) *BoardRole {
	for _, member := range b.Members {
		if member.UserID == userID {
			return &member.Role
		}
	}
	return nil
}
