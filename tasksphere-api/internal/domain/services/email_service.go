package services

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

// EmailService defines the interface for email operations
type EmailService interface {
	SendBoardInvitation(ctx context.Context, invitation *entities.BoardInvitation, board *entities.Board, inviter *entities.User) error
	SendInvitationAccepted(ctx context.Context, memberEmail, memberName, boardTitle string, inviterEmail string) error
	SendInvitationDeclined(ctx context.Context, memberName, boardTitle string, inviterEmail string) error
}

// EmailTemplate represents email template data
type EmailTemplate struct {
	Subject string
	Body    string
	IsHTML  bool
}

// BoardInvitationEmailData represents data for board invitation email
type BoardInvitationEmailData struct {
	InviterName   string
	BoardTitle    string
	InviteURL     string
	ExpiresAt     string
	RecipientName string
}
