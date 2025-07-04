package board

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// MemberUseCase handles board business logic
type MemberUseCase struct {
	boardRepo       repositories.BoardRepository
	boardMemberRepo repositories.BoardMemberRepository
	userRepo        repositories.UserRepository
	localizer       services.I18nService
}

func NewMemberUseCase(
	boardRepo repositories.BoardRepository,
	boardMemberRepo repositories.BoardMemberRepository,
	userRepo repositories.UserRepository,
) *MemberUseCase {
	return &MemberUseCase{
		boardRepo:       boardRepo,
		boardMemberRepo: boardMemberRepo,
		userRepo:        userRepo,
		localizer:       i18n.Get(),
	}
}

// InviteMember invites a user to join the board
func (uc *UseCase) InviteMember(ctx context.Context, boardID, inviterID bson.ObjectID, req *dto.InviteMemberRequest, lang string) (*dto.BoardInvitationResponse, error) {
	// Check inviter's permission
	inviterMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, inviterID)
	if err != nil || !inviterMember.IsActive() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Get board
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if board allows invitations
	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_cannot_be_modified"))
	}

	// Check if inviter has permission to invite
	if !board.Settings.AllowMemberInvite && !inviterMember.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.cannot_invite_members"))
	}

	invitee, err := uc.userRepo.GetByEmail(ctx, req.Email)
	if err == nil {
		// If the user exists, check if already a board member
		existingMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, invitee.ID)
		if err == nil && existingMember.IsActive() {
			return nil, errors.NewConflictError(uc.localizer.T(lang, "errors.user_already_member"))
		}
	}

	// Check if there's already a pending invitation
	existingInvitations, err := uc.invitationRepo.GetByEmail(ctx, req.Email, entities.InvitationStatusPending)
	if err == nil {
		for _, inv := range existingInvitations {
			if inv.BoardID == boardID && inv.IsPending() {
				return nil, errors.NewConflictError(uc.localizer.T(lang, "errors.invitation_already_sent"))
			}
		}
	}

	// Generate invitation token
	token, err := uc.generateInvitationToken()
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Create invitation
	invitation := &entities.BoardInvitation{
		Base:      entities.NewBase(),
		BoardID:   boardID,
		Email:     req.Email,
		Role:      entities.BoardRole(req.Role),
		InvitedBy: inviterID,
		Status:    entities.InvitationStatusPending,
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 7 days
	}
	// Save invitation
	if err = uc.invitationRepo.Create(ctx, invitation); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get inviter info
	inviter, err := uc.userRepo.GetByID(ctx, inviterID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Send email invitation
	if err := uc.notification.SendBoardInvitation(ctx, invitation, board, inviter, lang); err != nil {
		// Log error but don't fail the operation
		// TODO: Add proper logging
	}

	return dto.InvitationToResponse(invitation, board, inviter), nil
}

// InviteMembers invites multiple users to join the board
func (uc *UseCase) InviteMembers(ctx context.Context, boardID, inviterID bson.ObjectID, req *dto.InviteMembersRequest, lang string) (*dto.InvitationResultResponse, error) {
	// Check inviter's permission
	inviterMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, inviterID)
	if err != nil || !inviterMember.IsActive() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	if !board.Settings.AllowMemberInvite && !inviterMember.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.cannot_invite_members"))
	}

	var successful []string
	var failed []string
	var errorMessages []string

	for _, email := range req.Emails {
		inviteReq := &dto.InviteMemberRequest{
			Email: email,
			Role:  req.Role,
		}

		_, err := uc.InviteMember(ctx, boardID, inviterID, inviteReq, lang)
		if err != nil {
			failed = append(failed, email)
			errorMessages = append(errorMessages, fmt.Sprintf("%s: %s", email, err.Error()))
		} else {
			successful = append(successful, email)
		}
	}

	return &dto.InvitationResultResponse{
		Successful: successful,
		Failed:     failed,
		Errors:     errorMessages,
	}, nil
}

// AcceptInvitation accepts a board invitation
func (uc *UseCase) AcceptInvitation(ctx context.Context, userID bson.ObjectID, req *dto.AcceptInvitationRequest, lang string) (*dto.BoardResponse, error) {
	// Get invitation by token
	invitation, err := uc.invitationRepo.GetByToken(ctx, req.Token)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.invitation_not_found"))
	}

	// Check if invitation is valid
	if !invitation.IsPending() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invitation_invalid"))
	}

	// Get user email to verify
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Verify email matches
	if user.Email != invitation.Email {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.invitation_email_mismatch"))
	}

	// Check if user is already a member
	existingMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, invitation.BoardID, userID)
	if err == nil && existingMember.IsActive() {
		// Accept invitation anyway and return board
		invitation.Accept()
		uc.invitationRepo.Update(ctx, invitation)

		board, _ := uc.boardRepo.GetByID(ctx, invitation.BoardID)
		owner, _ := uc.userRepo.GetByID(ctx, board.OwnerID)
		memberCount, _ := uc.boardMemberRepo.CountByBoard(ctx, invitation.BoardID, entities.MemberStatusAccepted)

		return dto.BoardToResponse(board, owner, existingMember.Role, int(memberCount)), nil
	}

	// Create board membership
	member := &entities.BoardMember{
		Base:      entities.NewBase(),
		UserID:    userID,
		BoardID:   invitation.BoardID,
		Role:      invitation.Role,
		Status:    entities.MemberStatusAccepted,
		InvitedBy: invitation.InvitedBy,
		InvitedAt: invitation.CreatedAt,
		NotificationSettings: entities.GetDefaultNotificationSettings(),
	}

	// Save membership
	if err := uc.boardMemberRepo.Create(ctx, member); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Accept invitation
	invitation.Accept()
	if err := uc.invitationRepo.Update(ctx, invitation); err != nil {
		// Log error but don't fail the operation
	}

	// Get board and owner info
	board, err := uc.boardRepo.GetByID(ctx, invitation.BoardID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	owner, err := uc.userRepo.GetByID(ctx, board.OwnerID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	memberCount, _ := uc.boardMemberRepo.CountByBoard(ctx, invitation.BoardID, entities.MemberStatusAccepted)

	return dto.BoardToResponse(board, owner, member.Role, int(memberCount)), nil
}

// RejectInvitation rejects a board invitation
func (uc *UseCase) RejectInvitation(ctx context.Context, userID bson.ObjectID, req *dto.AcceptInvitationRequest, lang string) error {
	// Get invitation by token
	invitation, err := uc.invitationRepo.GetByToken(ctx, req.Token)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.invitation_not_found"))
	}

	// Check if invitation is valid
	if !invitation.IsPending() {
		return errors.NewBadRequestError(uc.localizer.T(lang, "errors.invitation_expired"))
	}

	// Get user email to verify
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.user_not_found"))
	}

	// Verify email matches
	if user.Email != invitation.Email {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.invitation_email_mismatch"))
	}

	// Reject invitation
	invitation.Reject()
	if err := uc.invitationRepo.Update(ctx, invitation); err != nil {
		return errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *MemberUseCase) GetBoardMembers(ctx context.Context, boardID, userID bson.ObjectID, lang string) ([]*dto.BoardMemberResponse, error) {
	// Check user's access to the board
	requestingMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !requestingMember.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	membersWithInfo, err := uc.boardMemberRepo.GetMembersWithUserInfo(ctx, boardID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	responses := make([]*dto.BoardMemberResponse, 0, len(membersWithInfo))
	for _, memberInfo := range membersWithInfo {
		if memberInfo.Member.IsActive() {
			response := dto.BoardMemberToResponse(memberInfo.Member, memberInfo.User)
			responses = append(responses, response)
		}
	}

	return responses, nil
}

func (uc *MemberUseCase) UpdateMemberRole(ctx context.Context, boardID, userID, memberID bson.ObjectID, req *dto.UpdateMemberRoleRequest, lang string) (*dto.BoardMemberResponse, error) {
	requestingMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !requestingMember.IsActive() || !requestingMember.IsAdmin() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	targetMember, err := uc.boardMemberRepo.GetByID(ctx, memberID)
	if err != nil || targetMember.BoardID != boardID {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.member_not_found"))
	}

	// Prevent changing owner role
	if targetMember.IsOwner() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.cannot_change_owner_role"))
	}

	// Only owner can assign admin role
	newRole := entities.BoardRole(req.Role)
	if newRole == entities.BoardRoleAdmin && !requestingMember.IsOwner() {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Prevent owner from demoting themselves
	if requestingMember.IsOwner() && requestingMember.ID == memberID && newRole != entities.BoardRoleOwner {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.cannot_change_own_role"))
	}

	// Update role
	if err := uc.boardMemberRepo.UpdateRole(ctx, memberID, newRole); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get updated member
	updatedMember, err := uc.boardMemberRepo.GetByID(ctx, memberID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get user info
	user, err := uc.userRepo.GetByID(ctx, targetMember.UserID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return dto.BoardMemberToResponse(updatedMember, user), nil
}

func (uc *MemberUseCase) RemoveMember(ctx context.Context, boardID, userID, memberID bson.ObjectID, lang string) error {
	// Check user's permission (only admin/owner can remove members)
	requestingMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !requestingMember.IsActive() || !requestingMember.IsAdmin() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Get target member
	targetMember, err := uc.boardMemberRepo.GetByID(ctx, memberID)
	if err != nil || targetMember.BoardID != boardID {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.member_not_found"))
	}

	// Prevent removing owner
	if targetMember.IsOwner() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.cannot_remove_owner"))
	}

	// Only owner can remove admin
	if targetMember.IsAdmin() && !requestingMember.IsOwner() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Prevent owner from removing themselves
	if requestingMember.IsOwner() && requestingMember.ID == memberID {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.cannot_remove_yourself"))
	}

	// Remove member
	if err := uc.boardMemberRepo.UpdateStatus(ctx, memberID, entities.MemberStatusRemoved); err != nil {
		return errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *MemberUseCase) LeaveBoard(ctx context.Context, boardID, userID bson.ObjectID, lang string) error {
	// Get user's membership
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.member_not_found"))
	}

	// Prevent owner from leaving (they must transfer ownership first)
	if member.IsOwner() {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.owner_cannot_leave"))
	}

	// Remove member
	if err := uc.boardMemberRepo.UpdateStatus(ctx, member.ID, entities.MemberStatusRemoved); err != nil {
		return errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *MemberUseCase) UpdateNotificationSettings(ctx context.Context, boardID, userID bson.ObjectID, req *dto.UpdateNotificationSettingsRequest, lang string) (*dto.NotificationSettingsResponse, error) {
	// Get user's membership
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.member_not_found"))
	}

	// Update settings
	settings := member.NotificationSettings
	if req.ReceiveTaskUpdates != nil {
		settings.ReceiveTaskUpdates = *req.ReceiveTaskUpdates
	}
	if req.ReceiveMentions != nil {
		settings.ReceiveMentions = *req.ReceiveMentions
	}
	if req.ReceiveComments != nil {
		settings.ReceiveComments = *req.ReceiveComments
	}
	if req.ReceiveBoardActivity != nil {
		settings.ReceiveBoardActivity = *req.ReceiveBoardActivity
	}

	// Save settings
	if err := uc.boardMemberRepo.UpdateNotificationSettings(ctx, member.ID, settings); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return &dto.NotificationSettingsResponse{
		ReceiveTaskUpdates:   settings.ReceiveTaskUpdates,
		ReceiveMentions:      settings.ReceiveMentions,
		ReceiveComments:      settings.ReceiveComments,
		ReceiveBoardActivity: settings.ReceiveBoardActivity,
	}, nil
}

// generateInvitationToken generates a secure random token for invitations
func (uc *UseCase) generateInvitationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
