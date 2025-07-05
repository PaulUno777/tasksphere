package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type Category struct {
	*Base `bson:",inline"`

	Name        string        `bson:"name"`
	Description *string       `bson:"description,omitempty"`
	Color       string        `bson:"color"`
	BoardID     bson.ObjectID `bson:"boardId"`
	CreatedBy   bson.ObjectID `bson:"createdBy"`

	Position int  `bson:"position"`
	IsActive bool `bson:"isActive"`
}

// Business methods for Category
func (c *Category) IsUsable() bool {
	return c.IsActive
}

func (c *Category) Deactivate() {
	c.IsActive = false
	c.UpdateTimestamp()
}

func (c *Category) Activate() {
	c.IsActive = true
	c.UpdateTimestamp()
}

func (c *Category) UpdateName(name string) {
	c.Name = name
	c.UpdateTimestamp()
}

func (c *Category) UpdateDescription(description *string) {
	c.Description = description
	c.UpdateTimestamp()
}

func (c *Category) UpdateColor(color string) {
	c.Color = color
	c.UpdateTimestamp()
}

func (c *Category) UpdatePosition(position int) {
	c.Position = position
	c.UpdateTimestamp()
}
