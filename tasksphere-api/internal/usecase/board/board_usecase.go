package board

import (
	"context"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/notification"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// UseCase handles board business logic
type UseCase struct {
	boardRepo       repositories.BoardRepository
	boardMemberRepo repositories.BoardMemberRepository
	invitationRepo  repositories.BoardInvitationRepository
	userRepo        repositories.UserRepository
	notification    *notification.UseCase
	localizer       services.I18nService
}

func NewUseCase(
	boardRepo repositories.BoardRepository,
	boardMemberRepo repositories.BoardMemberRepository,
	invitationRepo repositories.BoardInvitationRepository,
	userRepo repositories.UserRepository,
	notification *notification.UseCase,
) *UseCase {
	return &UseCase{
		boardRepo:       boardRepo,
		boardMemberRepo: boardMemberRepo,
		invitationRepo:  invitationRepo,
		userRepo:        userRepo,
		localizer:       i18n.Get(),
		notification:    notification,
	}
}

func (uc *UseCase) CreateBoard(ctx context.Context, userID bson.ObjectID, req *dto.CreateBoardRequest, lang string) (*dto.BoardResponse, error) {
	board := &entities.Board{
		Base:        entities.NewBase(),
		Title:       req.Title,
		Description: req.Description,
		OwnerID:     userID,
		Color:       req.Color,
		Status:      entities.BoardStatusActive,
		Settings:    entities.GetDefaultBoardSettings(),
	}

	// Apply custom settings if provided
	if req.Settings != nil {
		if req.Settings.AllowComments != nil {
			board.Settings.AllowComments = *req.Settings.AllowComments
		}
		if req.Settings.AutoArchiveCompletedDays != nil {
			board.Settings.AutoArchiveCompletedDays = *req.Settings.AutoArchiveCompletedDays
		}
		if req.Settings.RequireInviteApproval != nil {
			board.Settings.RequireInviteApproval = *req.Settings.RequireInviteApproval
		}
		if req.Settings.AllowMemberInvite != nil {
			board.Settings.AllowMemberInvite = *req.Settings.AllowMemberInvite
		}
	}

	if err := uc.boardRepo.Create(ctx, board); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Add owner as admin member
	ownerMember := &entities.BoardMember{
		Base:                 entities.NewBase(),
		UserID:               userID,
		BoardID:              board.ID,
		Role:                 entities.BoardRoleOwner,
		Status:               entities.MemberStatusAccepted,
		InvitedBy:            userID,
		InvitedAt:            time.Now(),
		NotificationSettings: entities.GetDefaultNotificationSettings(),
	}
	if err := uc.boardMemberRepo.Create(ctx, ownerMember); err != nil {
		uc.boardRepo.Delete(ctx, board.ID)
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get owner info
	owner, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return dto.BoardToResponse(board, owner, entities.BoardRoleOwner, 1), nil
}

// GetBoard gets a board by ID
func (uc *UseCase) GetBoard(ctx context.Context, userID, boardID bson.ObjectID, lang string) (*dto.BoardResponse, error) {
	// Check if user has access to board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.member_not_found"))
	}

	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if board is accessible
	if board.IsDeleted() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Get owner info
	owner, err := uc.userRepo.GetByID(ctx, board.OwnerID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	memberCount, err := uc.boardMemberRepo.CountByBoard(ctx, boardID, entities.MemberStatusAccepted)
	if err != nil {
		memberCount = 0
	}

	// Update user's last activity
	member.UpdateLastActivity()
	uc.boardMemberRepo.Update(ctx, member)

	return dto.BoardToResponse(board, owner, member.Role, int(memberCount)), nil
}

// GetBoards gets user's boards with pagination
func (uc *UseCase) GetBoards(ctx context.Context, userID bson.ObjectID, filter BoardQueryFilter, lang string) (*utils.Page[*dto.BoardResponse], error) {
	repoFilter := repositories.BoardFilter{
		Status: entities.BoardStatus(filter.Status),
		Search: filter.Search,
		Page:   filter.Page,
		Limit:  filter.Limit,
	}

	boards, total, err := uc.boardRepo.List(ctx, userID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	boardResponses := make([]*dto.BoardResponse, 0, len(boards))
	for _, board := range boards {
		// Get owner info
		owner, err := uc.userRepo.GetByID(ctx, board.OwnerID)
		if err != nil {
			continue // Skip boards with missing owner info
		}
		// Get user's role
		member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, board.ID, userID)
		if err != nil {
			continue // Skip boards user doesn't have access to
		}
		// Get member count
		memberCount, _ := uc.boardMemberRepo.CountByBoard(ctx, board.ID, entities.MemberStatusAccepted)

		boardResponse := dto.BoardToResponse(board, owner, member.Role, int(memberCount))
		boardResponses = append(boardResponses, boardResponse)
	}

	return utils.NewPage(boardResponses, &filter.BaseFilter, total), nil
}

// UpdateBoard updates a board
func (uc *UseCase) UpdateBoard(ctx context.Context, userID, boardID bson.ObjectID, req *dto.UpdateBoardRequest, lang string) (*dto.BoardResponse, error) {
	// Check permissions (only ADMIN can update)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() || !member.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if board can be modified
	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_cannot_be_modified"))
	}

	changed := false
	if req.Title != "" {
		board.Title = req.Title
		changed = true
	}
	if req.Description != nil {
		board.Description = req.Description
		changed = true
	}
	if req.Color != nil {
		board.Color = req.Color
		changed = true
	}

	if changed {
		if err := uc.boardRepo.Update(ctx, board); err != nil {
			return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
		}
	}
	// Get owner info for response
	owner, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}
	memberCount, _ := uc.boardMemberRepo.CountByBoard(ctx, boardID, entities.MemberStatusAccepted)

	return dto.BoardToResponse(board, owner, member.Role, int(memberCount)), nil
}

// UpdateBoardSettings updates board settings
func (uc *UseCase) UpdateBoardSettings(ctx context.Context, boardID, userID bson.ObjectID, req *dto.BoardSettingsRequest, lang string) (*dto.BoardSettingsResponse, error) {
	// Check user's permission (only admin/owner can update settings)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() || !member.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Get current board
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if board can be modified
	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_cannot_be_modified"))
	}

	// Update settings
	settings := board.Settings
	if req.AllowComments != nil {
		settings.AllowComments = *req.AllowComments
	}
	if req.AutoArchiveCompletedDays != nil {
		settings.AutoArchiveCompletedDays = *req.AutoArchiveCompletedDays
	}
	if req.RequireInviteApproval != nil {
		settings.RequireInviteApproval = *req.RequireInviteApproval
	}
	if req.AllowMemberInvite != nil {
		settings.AllowMemberInvite = *req.AllowMemberInvite
	}

	// Save settings
	if err := uc.boardRepo.UpdateSettings(ctx, boardID, settings); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return dto.BoardSettingsToResponse(settings), nil
}

// ArchiveBoard archives a board
func (uc *UseCase) ArchiveBoard(ctx context.Context, boardID, userID bson.ObjectID, lang string) error {
	// Check user's permission (only owner can archive)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() || !member.IsOwner() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	if board.IsArchived() {
		return errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_already_archived"))
	}

	if board.IsDeleted() {
		return errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_deleted"))
	}

	board.Archive()

	return uc.boardRepo.Update(ctx, board)
}

// RestoreBoard restores an archived board
func (uc *UseCase) RestoreBoard(ctx context.Context, boardID, userID bson.ObjectID, lang string) error {
	// Check user's permission (only owner can restore)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() || !member.IsOwner() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Get board
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if board can be restored
	if !board.IsArchived() {
		return errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_not_archived"))
	}

	// Restore board
	board.Restore()

	return uc.boardRepo.Update(ctx, board)
}

// DeleteBoard deletes a board
func (uc *UseCase) DeleteBoard(ctx context.Context, boardID, userID bson.ObjectID, lang string) error {
	// Check user's permission (only owner can delete)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() || !member.IsOwner() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Get board
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if board is already deleted
	if board.IsDeleted() {
		return errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_already_deleted"))
	}

	// Soft delete board
	board.SoftDelete()

	return uc.boardRepo.Update(ctx, board)
}

// GetBoardStats gets board statistics
func (uc *UseCase) GetBoardStats(ctx context.Context, boardID, userID bson.ObjectID, lang string) (*dto.BoardStatsResponse, error) {
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.member_not_found"))
	}

	// Get computed stats
	stats, err := uc.boardRepo.GetStats(ctx, boardID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}
	// Calculate completion rate
	completionRate := "0%"
	if stats.TotalTasks > 0 {
		rate := float64(stats.CompletedTasks) / float64(stats.TotalTasks) * 100
		completionRate = fmt.Sprintf("%.1f%%", rate)
	}

	return &dto.BoardStatsResponse{
		TotalTasks:      stats.TotalTasks,
		CompletedTasks:  stats.CompletedTasks,
		OverdueTasks:    stats.OverdueTasks,
		TotalMembers:    stats.TotalMembers,
		ActiveMembers:   stats.ActiveMembers,
		PendingInvites:  stats.PendingInvites,
		LastActivity:    stats.LastActivity.Format(time.RFC3339),
		CreatedThisWeek: stats.CreatedThisWeek,
		UpdatedThisWeek: stats.UpdatedThisWeek,
		CompletionRate:  completionRate,
	}, nil
}
