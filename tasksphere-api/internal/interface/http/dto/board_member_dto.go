package dto

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

// InviteMemberRequest represents member invitation request
type InviteMemberRequest struct {
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required,oneof=ADMIN MEMBER GUEST"`
}

// InviteMembersRequest represents multiple member invitation request
type InviteMembersRequest struct {
	Emails []string `json:"emails" validate:"required,min=1,max=10,dive,email"`
	Role   string   `json:"role" validate:"required,oneof=ADMIN MEMBER GUEST"`
}

// UpdateMemberRoleRequest represents member role update request
type UpdateMemberRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=ADMIN MEMBER GUEST"`
}

// AcceptInvitationRequest represents invitation acceptance request
type AcceptInvitationRequest struct {
	Token string `json:"token" validate:"required"`
}

type UpdateNotificationSettingsRequest struct {
	ReceiveTaskUpdates   *bool `json:"receiveTaskUpdates"`
	ReceiveMentions      *bool `json:"receiveMentions"`
	ReceiveComments      *bool `json:"receiveComments"`
	ReceiveBoardActivity *bool `json:"receiveBoardActivity"`
}

// BoardMemberResponse represents board member in API responses
type BoardMemberResponse struct {
	ID                   string                        `json:"id"`
	User                 *UserResponse                 `json:"user"`
	Role                 string                        `json:"role"`
	Status               string                        `json:"status"`
	InvitedBy            string                        `json:"invitedBy"`
	InvitedAt            string                        `json:"invitedAt"`
	LastActiveAt         *string                       `json:"lastActiveAt,omitempty"`
	NotificationSettings *NotificationSettingsResponse `json:"notificationSettings"`
	JoinedAt             string                        `json:"joinedAt"`
}

// NotificationSettingsResponse represents notification settings in API responses
type NotificationSettingsResponse struct {
	ReceiveTaskUpdates   bool `json:"receiveTaskUpdates"`
	ReceiveMentions      bool `json:"receiveMentions"`
	ReceiveComments      bool `json:"receiveComments"`
	ReceiveBoardActivity bool `json:"receiveBoardActivity"`
}

// BoardInvitationResponse represents board invitation in API responses
type BoardInvitationResponse struct {
	ID        string         `json:"id"`
	Board     *BoardResponse `json:"board"`
	Email     string         `json:"email"`
	Role      string         `json:"role"`
	InvitedBy *UserResponse  `json:"invitedBy"`
	Status    string         `json:"status"`
	Token     string         `json:"token,omitempty"`
	ExpiresAt string         `json:"expiresAt"`
	CreatedAt string         `json:"createdAt"`
}

// InvitationResultResponse represents invitation operation result
type InvitationResultResponse struct {
	Successful []string `json:"successful"`
	Failed     []string `json:"failed"`
	Errors     []string `json:"errors,omitempty"`
}

// mapInvitationToResponse maps invitation entity to response DTO
func InvitationToResponse(invitation *entities.BoardInvitation, board *entities.Board, inviter *entities.User) *BoardInvitationResponse {
	return &BoardInvitationResponse{
		ID:    invitation.GetID(),
		Email: invitation.Email,
		Role:  string(invitation.Role),
		Board: &BoardResponse{
			ID:    board.GetID(),
			Title: board.Title,
		},
		InvitedBy: UserToResponse(inviter),
		Status:    string(invitation.Status),
		Token:     invitation.Token,
		ExpiresAt: invitation.ExpiresAt.Format(time.RFC3339),
		CreatedAt: invitation.CreatedAt.Format(time.RFC3339),
	}
}

func NotificationSettingsToResponse(settings *entities.NotificationSettings) *NotificationSettingsResponse {
	return &NotificationSettingsResponse{
		ReceiveTaskUpdates:   settings.ReceiveTaskUpdates,
		ReceiveMentions:      settings.ReceiveMentions,
		ReceiveComments:      settings.ReceiveComments,
		ReceiveBoardActivity: settings.ReceiveBoardActivity,
	}
}

func BoardMemberToResponse(member *entities.BoardMember, user *entities.User) *BoardMemberResponse {
	response := &BoardMemberResponse{
		ID:                   member.GetID(),
		User:                 UserToResponse(user),
		Role:                 string(member.Role),
		Status:               string(member.Status),
		InvitedBy:            member.InvitedBy.Hex(),
		InvitedAt:            member.InvitedAt.Format(time.RFC3339),
		JoinedAt:             member.CreatedAt.Format(time.RFC3339),
		NotificationSettings: NotificationSettingsToResponse(&member.NotificationSettings),
	}

	if member.LastActiveAt != nil {
		lastActive := member.LastActiveAt.Format(time.RFC3339)
		response.LastActiveAt = &lastActive
	}
	return response
}
