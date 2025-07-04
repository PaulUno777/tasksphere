package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Category struct {
	*Base `bson:",inline"`

	Name  string `bson:"name" json:"name"`
	Color string `bson:"color" json:"color"`

	BoardID bson.ObjectID `bson:"boardId"`
}
