package domain

import "go.mongodb.org/mongo-driver/v2/bson"

type Board struct {
	BaseEntity `bson:",inline"`

	Title       string        `bson:"title" json:"title"`
	Description *string       `bson:"description,omitempty" json:"description,omitempty"`
	OwnerID     bson.ObjectID `bson:"ownerId" json:"ownerId"`

	BoardMembers []bson.ObjectID `bson:"boardMembers,omitempty" json:"boardMembers,omitempty"`
	Tasks        []bson.ObjectID `bson:"tasks,omitempty" json:"tasks,omitempty"`
	Categories   []bson.ObjectID `bson:"categories,omitempty" json:"categories,omitempty"`
}
