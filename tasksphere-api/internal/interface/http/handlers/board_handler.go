package handlers

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/board"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardHandler struct {
	boardUseCase  *board.UseCase
	memberUseCase *board.MemberUseCase
	localizer     services.I18nService
}

func NewBoardHandler(
	boardUseCase *board.UseCase,
	memberUseCase *board.MemberUseCase,
) *BoardHandler {
	return &BoardHandler{
		boardUseCase:  boardUseCase,
		memberUseCase: memberUseCase,
		localizer:     i18n.Get(),
	}
}

func (h *BoardHandler) CreateBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	var req dto.CreateBoardRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.boardUseCase.CreateBoard(c.Context(), userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(c, response, h.localizer.T(lang, "messages.board_created"))
}

func (h *BoardHandler) ListBoards(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	// Parse pagination
	filter, err := utils.ParseFilterFromFiber[board.BoardQueryFilter](c)
	if err != nil {
		return errors.NewBadRequestError(err.Error())
	}
	if filter.Status == "" {
		filter.Status = "ACTIVE"
	}

	response, err := h.boardUseCase.GetBoards(c.Context(), userID, *filter, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *BoardHandler) GetBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	response, err := h.boardUseCase.GetBoard(c.Context(), userID, boardID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *BoardHandler) UpdateBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	var req dto.UpdateBoardRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.boardUseCase.UpdateBoard(c.Context(), userID, boardID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.localizer.T(lang, "messages.board_updated"))
}

// UpdateBoardSettings updates board settings
func (h *BoardHandler) UpdateBoardSettings(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	var req dto.BoardSettingsRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.boardUseCase.UpdateBoardSettings(c.Context(), boardID, userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.localizer.T(lang, "messages.board_settings_updated"))
}

// ArchiveBoard archives a board
func (h *BoardHandler) ArchiveBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	err = h.boardUseCase.ArchiveBoard(c.Context(), boardID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.localizer.T(lang, "messages.board_archived"))
}

// RestoreBoard restores an archived board
func (h *BoardHandler) RestoreBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	err = h.boardUseCase.RestoreBoard(c.Context(), boardID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.localizer.T(lang, "messages.board_restored"))
}

// DeleteBoard soft deletes a board
func (h *BoardHandler) DeleteBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	err = h.boardUseCase.DeleteBoard(c.Context(), boardID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.localizer.T(lang, "messages.board_deleted"))
}

// GetBoardStats gets board statistics
func (h *BoardHandler) GetBoardStats(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	response, err := h.boardUseCase.GetBoardStats(c.Context(), userID, boardID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

// GetBoardMembers gets all board members
func (h *BoardHandler) GetBoardMembers(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	response, err := h.memberUseCase.GetBoardMembers(c.Context(), boardID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

// InviteMember invites a single member to the board
func (h *BoardHandler) InviteMember(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	var req dto.InviteMemberRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.boardUseCase.InviteMember(c.Context(), boardID, userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(c, response, h.localizer.T(lang, "messages.invitation_sent"))
}

// InviteMembers invites multiple members to the board
func (h *BoardHandler) InviteMembers(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	var req dto.InviteMembersRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.boardUseCase.InviteMembers(c.Context(), boardID, userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.localizer.T(lang, "messages.invitations_processed"))
}

// AcceptInvitation accepts a board invitation
func (h *BoardHandler) AcceptInvitation(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	var req dto.AcceptInvitationRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.boardUseCase.AcceptInvitation(c.Context(), userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.localizer.T(lang, "messages.invitation_accepted"))
}

// RejectInvitation rejects a board invitation
func (h *BoardHandler) RejectInvitation(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	var req dto.AcceptInvitationRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	err := h.boardUseCase.RejectInvitation(c.Context(), userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.localizer.T(lang, "messages.invitation_rejected"))
}

// UpdateMemberRole updates a member's role
func (h *BoardHandler) UpdateMemberRole(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	memberID, err := bson.ObjectIDFromHex(c.Params("memberId"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_member_id"))
	}

	var req dto.UpdateMemberRoleRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.memberUseCase.UpdateMemberRole(c.Context(), boardID, userID, memberID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.localizer.T(lang, "messages.member_role_updated"))
}

// RemoveMember removes a member from the board
func (h *BoardHandler) RemoveMember(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	memberID, err := bson.ObjectIDFromHex(c.Params("memberId"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_member_id"))
	}

	err = h.memberUseCase.RemoveMember(c.Context(), boardID, userID, memberID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.localizer.T(lang, "messages.member_removed"))
}

// LeaveBoard allows a member to leave the board
func (h *BoardHandler) LeaveBoard(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	err = h.memberUseCase.LeaveBoard(c.Context(), boardID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.localizer.T(lang, "messages.left_board"))
}

// UpdateNotificationSettings updates member's notification preferences
func (h *BoardHandler) UpdateNotificationSettings(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.localizer.T(lang, "errors.invalid_board_id"))
	}

	var req dto.UpdateNotificationSettingsRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.memberUseCase.UpdateNotificationSettings(c.Context(), boardID, userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.localizer.T(lang, "messages.notification_settings_updated"))
}
