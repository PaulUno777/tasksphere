package dto

type CreateCategoryRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=50"`
	Description *string `json:"description" validate:"omitempty,max=200"`
	Color       string  `json:"color" validate:"required,hexcolor"`
}

type UpdateCategoryRequest struct {
	Name        *string  `json:"name" validate:"omitempty,min=2,max=50"`
	Description *string `json:"description" validate:"omitempty,max=200"`
	Color       *string  `json:"color" validate:"omitempty,hexcolor"`
}

type UpdateCategoryPositionRequest struct {
	Position int `json:"position" validate:"min=0"`
}

type CategoryResponse struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Description *string      `json:"description,omitempty"`
	Color       string       `json:"color"`
	Position    int          `json:"position"`
	IsActive    bool         `json:"isActive"`
	CreatedBy   *UserMinimal `json:"createdBy"`
	CreatedAt   string       `json:"createdAt"`
	UpdatedAt   string       `json:"updatedAt"`

	TaskCount int `json:"taskCount"`
}

type CategoryListResponse struct {
	Categories []*CategoryResponse `json:"categories"`
}
