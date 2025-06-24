package domain

import "go.mongodb.org/mongo-driver/v2/bson"

type Category struct {
	BaseEntity `bson:",inline"`

	Name  string `bson:"name" json:"name"`
	Color string `bson:"color" json:"color"`

	BoardID bson.ObjectID `bson:"boardId" json:"boardId"`
}
