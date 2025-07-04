package dto

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

// CreateBoardRequest represents board creation request
type CreateBoardRequest struct {
	Title       string                `json:"title" validate:"required,min=3,max=100"`
	Description *string               `json:"description" validate:"omitempty,max=500"`
	Color       *string               `json:"color" validate:"omitempty,hexcolor"`
	Settings    *BoardSettingsRequest `json:"settings"`
}

// UpdateBoardRequest represents board update request
type UpdateBoardRequest struct {
	Title       string  `json:"title" validate:"omitempty,min=3,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
	Color       *string `json:"color" validate:"omitempty,hexcolor"`
}

// BoardSettingsRequest represents board settings update request
type BoardSettingsRequest struct {
	AllowComments            *bool `json:"allowComments"`
	AutoArchiveCompletedDays *int  `json:"autoArchiveCompletedDays" validate:"omitempty,min=1,max=365"`
	RequireInviteApproval    *bool `json:"requireInviteApproval"`
	AllowMemberInvite        *bool `json:"allowMemberInvite"`
}

// BoardResponse represents board data in API responses
type BoardResponse struct {
	ID          string                 `json:"id"`
	Title       string                 `json:"title"`
	Description *string                `json:"description,omitempty"`
	Color       *string                `json:"color,omitempty"`
	Status      string                 `json:"status"`
	Owner       *UserResponse          `json:"owner"`
	Settings    *BoardSettingsResponse `json:"settings"`
	UserRole    *string                `json:"userRole,omitempty"`
	MemberCount int                    `json:"memberCount"`
	ArchivedAt  *string                `json:"archivedAt,omitempty"`
	CreatedAt   string                 `json:"createdAt"`
	UpdatedAt   string                 `json:"updatedAt"`
}

// BoardSettingsResponse represents board settings in API responses
type BoardSettingsResponse struct {
	AllowComments            bool `json:"allowComments"`
	AutoArchiveCompletedDays int  `json:"autoArchiveCompletedDays"`
	RequireInviteApproval    bool `json:"requireInviteApproval"`
	AllowMemberInvite        bool `json:"allowMemberInvite"`
}

// BoardStatsResponse represents computed board statistics
type BoardStatsResponse struct {
	TotalTasks      int    `json:"totalTasks"`
	CompletedTasks  int    `json:"completedTasks"`
	OverdueTasks    int    `json:"overdueTasks"`
	TotalMembers    int    `json:"totalMembers"`
	ActiveMembers   int    `json:"activeMembers"`
	PendingInvites  int    `json:"pendingInvites"`
	LastActivity    string `json:"lastActivity"`
	CreatedThisWeek int    `json:"createdThisWeek"`
	UpdatedThisWeek int    `json:"updatedThisWeek"`
	CompletionRate  string `json:"completionRate"`
}

func BoardSettingsToResponse(settings entities.BoardSettings) *BoardSettingsResponse {
	return &BoardSettingsResponse{
		AllowComments:            settings.AllowComments,
		AutoArchiveCompletedDays: settings.AutoArchiveCompletedDays,
		RequireInviteApproval:    settings.RequireInviteApproval,
		AllowMemberInvite:        settings.AllowMemberInvite,
	}
}

func BoardToResponse(board *entities.Board, owner *entities.User, userRole entities.BoardRole, memberCount int) *BoardResponse {
	response := &BoardResponse{
		ID:          board.GetID(),
		Title:       board.Title,
		Description: board.Description,
		Color:       board.Color,
		Status:      string(board.Status),
		Owner:       UserToResponse(owner),
		Settings:    BoardSettingsToResponse(board.Settings),
		MemberCount: memberCount,
		CreatedAt:   board.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   board.UpdatedAt.Format(time.RFC3339),
	}

	role := string(userRole)
	response.UserRole = &role

	if board.ArchivedAt != nil {
		archivedAt := board.ArchivedAt.Format(time.RFC3339)
		response.ArchivedAt = &archivedAt
	}

	return response
}
