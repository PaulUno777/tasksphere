package domain

import "go.mongodb.org/mongo-driver/v2/bson"

type Message struct {
	BaseEntity `bson:",inline"`

	Content string `bson:"content" json:"content"`

	AuthorID bson.ObjectID `bson:"authorId" json:"authorId"`
	TaskID   bson.ObjectID `bson:"taskId" json:"taskId"`
}
