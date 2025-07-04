package notification

import (
	"context"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UseCase struct {
	notificationService services.NotificationService
	notificationRepo    repositories.NotificationRepository
	userRepo            repositories.UserRepository
	localizer           services.I18nService
	logger              logger.Logger
}

// NewUseCase creates a new notification use case
func NewUseCase(
	notificationService services.NotificationService,
	notificationRepo repositories.NotificationRepository,
	userRepo repositories.UserRepository,
) *UseCase {
	return &UseCase{
		notificationService: notificationService,
		notificationRepo:    notificationRepo,
		userRepo:            userRepo,
		localizer:           i18n.Get(),
		logger:              *logger.Get(),
	}
}

func (uc *UseCase) SendEmailVerification(ctx context.Context, userID bson.ObjectID, token string, lang string) error {
	uc.logger.Info("Sending Verification Email")

	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.user_not_found"))
	}

	verificationURL := fmt.Sprintf("%s/verify-email?token=%s",
		getEnv("FRONTEND_URL", "http://localhost:4200"), token)

	message := &entities.NotificationMessage{
		Type:           entities.NotificationTypeEmailVerification,
		Channel:        entities.ChannelEmail,
		Priority:       entities.PriorityCritical,
		RecipientID:    userID,
		RecipientEmail: user.Email,
		RecipientName:  user.GetFullName(),
		Subject:        uc.localizer.T(lang, "email.verification.subject"),
		Data: map[string]interface{}{
			"userName":        user.GetFullName(),
			"verificationURL": verificationURL,
			"language":        lang,
		},
		ExpiresAt: func() *time.Time { t := time.Now().Add(30 * time.Minute); return &t }(),
	}

	_, err = uc.notificationService.Send(ctx, message)
	return err
}

func (uc *UseCase) SendBoardInvitation(ctx context.Context, invitation *entities.BoardInvitation, board *entities.Board, inviter *entities.User, lang string) error {
	uc.logger.Info("Sending Board Invitation")

	inviteURL := fmt.Sprintf("%s/invite?token=%s",
		getEnv("FRONTEND_URL", "http://localhost:4200"), invitation.Token)

	message := &entities.NotificationMessage{
		Type:           entities.NotificationTypeBoardInvite,
		Channel:        entities.ChannelEmail,
		Priority:       entities.PriorityHigh,
		RecipientID:    bson.NilObjectID, // No user ID for external invites
		RecipientEmail: invitation.Email,
		RecipientName:  invitation.Email, // Use email as name for external invites
		Subject: uc.localizer.T(lang, "email.board_invite.subject", map[string]interface{}{
			"BoardTitle": board.Title,
		}),
		Data: map[string]interface{}{
			"inviterName":  inviter.GetFullName(),
			"inviterEmail": inviter.Email,
			"boardTitle":   board.Title,
			"boardDesc":    board.Description,
			"role":         string(invitation.Role),
			"inviteURL":    inviteURL,
			"expiresAt":    invitation.ExpiresAt.Format("2006-01-02 15:04"),
			"language":     lang,
		},
		ExpiresAt: &invitation.ExpiresAt,
	}

	_, err := uc.notificationService.Send(ctx, message)
	return err
}

func (uc *UseCase) SendBoardWelcome(ctx context.Context, userID bson.ObjectID, board *entities.Board, role entities.BoardRole, lang string) error {
	uc.logger.Info("Sending Board Welcome")

	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.user_not_found"))
	}

	boardURL := fmt.Sprintf("%s/boards/%s",
		getEnv("FRONTEND_URL", "http://localhost:4200"), board.GetID())

	message := &entities.NotificationMessage{
		Type:           entities.NotificationTypeBoardWelcome,
		Channel:        entities.ChannelEmail,
		Priority:       entities.PriorityNormal,
		RecipientID:    userID,
		RecipientEmail: user.Email,
		RecipientName:  user.GetFullName(),
		Subject: uc.localizer.T(lang, "email.board_welcome.subject", map[string]interface{}{
			"BoardTitle": board.Title,
		}),
		Data: map[string]interface{}{
			"userName":   user.GetFullName(),
			"boardTitle": board.Title,
			"boardDesc":  board.Description,
			"role":       string(role),
			"boardURL":   boardURL,
			"language":   lang,
		},
	}

	_, err = uc.notificationService.Send(ctx, message)
	return err
}

func (uc *UseCase) ProcessRetries(ctx context.Context) error {
	uc.logger.Info("Process Retries")
	return uc.notificationService.ProcessRetries(ctx)
}

// CleanupExpired removes expired notification records
func (uc *UseCase) CleanupExpired(ctx context.Context) error {
	uc.logger.Info("Cleanup Expired")
	return uc.notificationService.CleanupExpired(ctx)
}

// Helper function to get environment variables
func getEnv(key, defaultValue string) string {
	// This should use the same helper from config package
	return defaultValue
}
