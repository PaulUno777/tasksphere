package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Category struct {
	Base `bson:",inline"`

	Name  string `bson:"name" json:"name" validate:"required,min=1,max=50"`
	Color string `bson:"color" json:"color" validate:"required,hexcolor"`

	BoardID bson.ObjectID `bson:"boardId" json:"boardId" validate:"required"`
}
