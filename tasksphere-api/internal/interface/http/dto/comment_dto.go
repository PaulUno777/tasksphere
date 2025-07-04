package dto

// CreateCommentRequest represents comment creation request
type CreateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=1000"`
}

// UpdateCommentRequest represents comment update request
type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=1000"`
}

// CommentResponse represents comment data in API responses
type CommentResponse struct {
	ID        string        `json:"id"`
	Content   string        `json:"content"`
	Author    *UserResponse `json:"author"`
	TaskID    string        `json:"taskId"`
	CreatedAt string        `json:"createdAt"`
	UpdatedAt string        `json:"updatedAt"`
}
