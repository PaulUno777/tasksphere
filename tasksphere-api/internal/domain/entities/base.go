package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Base struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	CreatedAt time.Time     `bson:"createdAt"`
	UpdatedAt time.Time     `bson:"updatedAt"`
}

func NewBase() *Base {
	return &Base{
		ID:        bson.NewObjectID(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func (b *Base) GetID() string {
	return b.ID.Hex()
}

func (b *Base) UpdateTimestamp() {
	b.UpdatedAt = time.Now()
}
