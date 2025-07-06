package dto

type CreateCommentRequest struct {
	Content  string   `json:"content" validate:"required,min=4,max=1000"`
	Mentions []string `json:"mentions" validate:"omitempty,dive"`
}

type UpdateCommentRequest struct {
	Content  string   `json:"content" validate:"required,min=1,max=1000"`
	Mentions []string `json:"mentions" validate:"omitempty,dive"`
}

type AddReactionRequest struct {
	Emoji string `json:"emoji" validate:"required,min=1,max=10"`
}

type CommentReactionResponse struct {
	User    *UserMinimal `json:"user"`
	Emoji   string       `json:"emoji"`
	AddedAt string       `json:"addedAt"`
}

type CommentResponse struct {
	ID           string                     `json:"id"`
	Content      string                     `json:"content"`
	Author       *UserMinimal               `json:"author"`
	TaskID       string                     `json:"taskId"`
	Type         string                     `json:"type"`
	IsEdited     bool                       `json:"isEdited"`
	LastEditedAt *string                    `json:"lastEditedAt,omitempty"`
	Reactions    []*CommentReactionResponse `json:"reactions,omitempty"`
	Mentions     []*UserMinimal             `json:"mentions,omitempty"`
	CreatedAt    string                     `json:"createdAt"`
	UpdatedAt    string                     `json:"updatedAt"`

	// Permissions
	CanEdit   bool `json:"canEdit"`
	CanDelete bool `json:"canDelete"`
}

type ReactionSummaryResponse struct {
	Emoji       string `json:"emoji"`
	Count       int    `json:"count"`
	UserReacted bool   `json:"userReacted"`
}

type CommentWithReactionsResponse struct {
	*CommentResponse
	ReactionSummary []*ReactionSummaryResponse `json:"reactionSummary"`
}
