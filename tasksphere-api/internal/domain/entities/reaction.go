package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Reaction struct {
	*Base `bson:",inline"`

	Type      ReactionType  `bson:"type"`
	CommentID bson.ObjectID `bson:"commentId"`
	UserID    bson.ObjectID `bson:"userId"`
}

// Business methods for Reaction
func (r *Reaction) CanBeRemoved(userID bson.ObjectID) bool {
	return r.UserID == userID
}

func (r *Reaction) ChangeType(newType ReactionType) {
	r.Type = newType
	r.UpdateTimestamp()
}
