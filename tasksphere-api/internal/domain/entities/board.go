package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Board struct {
	Base `bson:",inline"`

	Title       string        `bson:"title" json:"title" validate:"required,min=10,max=255"`
	Description *string       `bson:"description,omitempty" json:"description,omitempty" validate:"max=1000"`
	OwnerID     bson.ObjectID `bson:"ownerId" json:"ownerId" validate:"required"`

	Members []BoardMember `bson:"members,omitempty" json:"members,omitempty"`
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

func (b *Board) HasPermission(userID bson.ObjectID, requiredRole BoardRole) bool {
	if b.IsOwner(userID) {
		return true
	}

	role := b.GetMemberRole(userID)
	if role == nil {
		return false
	}

	switch requiredRole {
	case AdminRole:
		return *role == AdminRole
	case EditorRole:
		return *role == AdminRole || *role == EditorRole
	case ViewerRole:
		return true
	}

	return false
}
