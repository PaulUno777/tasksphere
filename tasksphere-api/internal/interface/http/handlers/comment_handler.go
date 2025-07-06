package handlers

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/comment"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// CommentHandler handles comment endpoints
type CommentHandler struct {
	commentUseCase *comment.UseCase
	i18n           services.I18nService
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(commentUseCase *comment.UseCase) *CommentHandler {
	return &CommentHandler{
		commentUseCase: commentUseCase,
		i18n:           i18n.Get(),
	}
}

func (h *CommentHandler) CreateComment(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("taskId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	var req dto.CreateCommentRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.commentUseCase.CreateComment(c.Context(), userID, taskID, &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(c, response, h.i18n.T(lang, "messages.comment_created"))
}

func (h *CommentHandler) GetTaskComments(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("taskId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	// Unified parsing
	filter, err := utils.ParseFilterFromFiber[comment.CommentQueryFilter](c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid query parameters")
	}

	response, err := h.commentUseCase.GetTaskComments(c.Context(), userID, taskID, *filter, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *CommentHandler) GetComment(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	commentID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_comment_id"))
	}

	response, err := h.commentUseCase.GetComment(c.Context(), userID, commentID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *CommentHandler) UpdateComment(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	commentID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_comment_id"))
	}

	var req dto.UpdateCommentRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.commentUseCase.UpdateComment(c.Context(), userID, commentID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.comment_updated"))
}

func (h *CommentHandler) DeleteComment(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	commentID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_comment_id"))
	}

	err = h.commentUseCase.DeleteComment(c.Context(), commentID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.comment_deleted"))
}

func (h *CommentHandler) AddReaction(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	commentID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_comment_id"))
	}

	var req dto.AddReactionRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.commentUseCase.AddReaction(c.Context(), commentID, &req, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.reaction_added"))
}

func (h *CommentHandler) RemoveReaction(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	commentID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_comment_id"))
	}

	emoji := c.Params("emoji")
	if emoji == "" {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.emoji_required"))
	}

	response, err := h.commentUseCase.RemoveReaction(c.Context(), commentID, emoji, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.reaction_removed"))
}

func (h *CommentHandler) GetUserMentions(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	// Unified parsing
	filter, err := utils.ParseFilterFromFiber[comment.CommentQueryFilter](c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid query parameters")
	}

	response, err := h.commentUseCase.GetUserMentions(c.Context(), *filter, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}
