package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Comment struct {
	Base `bson:",inline"`

	Content  string        `bson:"content" json:"content" validate:"required,min=1,max=2000"`
	AuthorID bson.ObjectID `bson:"authorId" json:"authorId" validate:"required"`
	TaskID   bson.ObjectID `bson:"taskId" json:"taskId" validate:"required"`
}
