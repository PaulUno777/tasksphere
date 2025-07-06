package comment

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UseCase struct {
	boardMemberRepo repositories.BoardMemberRepository
	commentRepo     repositories.CommentRepository
	boardRepo       repositories.BoardRepository
	taskRepo        repositories.TaskRepository
	userRepo        repositories.UserRepository
	i18n            services.I18nService
}

// NewUseCase creates a new comment use case
func NewUseCase(
	boardMemberRepo repositories.BoardMemberRepository,
	commentRepo repositories.CommentRepository,
	boardRepo repositories.BoardRepository,
	taskRepo repositories.TaskRepository,
	userRepo repositories.UserRepository,
) *UseCase {
	return &UseCase{
		boardMemberRepo: boardMemberRepo,
		commentRepo:     commentRepo,
		boardRepo:       boardRepo,
		taskRepo:        taskRepo,
		userRepo:        userRepo,
		i18n:            i18n.Get(),
	}
}

func (uc *UseCase) CreateComment(ctx context.Context, userID, taskID bson.ObjectID, req *dto.CreateCommentRequest, lang string) (*dto.CommentResponse, error) {
	// Get task to verify board access
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.member_not_found"))
	}

	board, err := uc.boardRepo.GetByID(ctx, task.BoardID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	if !board.Settings.AllowComments {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.comments_not_allowed"))
	}

	// Parse mentions from content and explicit mentions
	mentions := uc.extractMentions(req.Content)

	// Add explicit mentions
	for _, mentionID := range req.Mentions {
		if id, err := bson.ObjectIDFromHex(mentionID); err == nil {
			// Check if mentioned user is a board member
			if mentionedMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, id); err == nil && mentionedMember.IsActive() {
				// Add to mentions if not already present
				found := false
				for _, existing := range mentions {
					if existing == id {
						found = true
						break
					}
				}
				if !found {
					mentions = append(mentions, id)
				}
			}
		}
	}

	comment := &entities.Comment{
		Base:      entities.NewBase(),
		Content:   req.Content,
		Type:      entities.CommentTypeRegular,
		AuthorID:  userID,
		TaskID:    taskID,
		Mentions:  mentions,
		Reactions: make([]entities.CommentReaction, 0),
		IsEdited:  false,
	}

	if err := uc.commentRepo.Create(ctx, comment); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get comment with details for response
	commentDetail, err := uc.getCommentWithDetails(ctx, comment.ID, lang)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapCommentToResponse(commentDetail, userID), nil
}

// GetComments gets comments for a task with pagination
func (uc *UseCase) GetTaskComments(ctx context.Context, userID, taskID bson.ObjectID, filter CommentQueryFilter, lang string) (*utils.Page[*dto.CommentResponse], error) {
	// Get task to verify board access
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.member_not_found"))
	}

	// Convert query filter to repository filter
	repoFilter := uc.convertQueryFilter(filter)

	// Get comments with details
	commentsWithDetails, err := uc.commentRepo.GetCommentsWithDetails(ctx, taskID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get total count
	_, total, err := uc.commentRepo.GetByTask(ctx, taskID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Convert to response DTOs
	commentResponses := make([]*dto.CommentResponse, len(commentsWithDetails))
	for i, commentDetail := range commentsWithDetails {
		commentResponses[i] = uc.mapCommentToResponse(commentDetail, userID)
	}

	return utils.NewPage(commentResponses, &filter.BaseFilter, total), nil
}

func (uc *UseCase) GetComment(ctx context.Context, userID bson.ObjectID, commentID bson.ObjectID, lang string) (*dto.CommentResponse, error) {
	// Get comment
	comment, err := uc.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Check if comment is visible
	if !comment.IsVisible() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Get task to check board access
	task, err := uc.taskRepo.GetByID(ctx, comment.TaskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Get comment with details
	commentDetail, err := uc.getCommentWithDetails(ctx, commentID, lang)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapCommentToResponse(commentDetail, userID), nil
}

// UpdateComment updates a comment
func (uc *UseCase) UpdateComment(ctx context.Context, userID, commentID bson.ObjectID, req *dto.UpdateCommentRequest, lang string) (*dto.CommentResponse, error) {
	comment, err := uc.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Check if comment can be edited
	if !comment.CanBeEdited() || comment.AuthorID != userID {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.cannot_edit_comment"))
	}

	// Get task to check board access
	task, err := uc.taskRepo.GetByID(ctx, comment.TaskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Parse mentions from content
	mentions := uc.extractMentions(req.Content)

	// Add explicit mentions
	for _, mentionID := range req.Mentions {
		if id, err := bson.ObjectIDFromHex(mentionID); err == nil {
			// Check if mentioned user is a board member
			if mentionedMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, id); err == nil && mentionedMember.IsActive() {
				// Add to mentions if not already present
				found := false
				for _, existing := range mentions {
					if existing == id {
						found = true
						break
					}
				}
				if !found {
					mentions = append(mentions, id)
				}
			}
		}
	}

	// Update comment using business logic
	comment.Edit(req.Content, userID)
	comment.SetMentions(mentions)

	// Save comment
	if err := uc.commentRepo.Update(ctx, comment); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated comment with details
	commentDetail, err := uc.getCommentWithDetails(ctx, commentID, lang)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapCommentToResponse(commentDetail, userID), nil
}

func (uc *UseCase) DeleteComment(ctx context.Context, commentID bson.ObjectID, userID bson.ObjectID, lang string) error {
	// Get comment
	comment, err := uc.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Get task to check board access
	task, err := uc.taskRepo.GetByID(ctx, comment.TaskID)
	if err != nil {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Check if user can delete comment (author or admin)
	if comment.AuthorID != userID && !member.IsAdmin() {
		return errors.NewForbiddenError(uc.i18n.T(lang, "errors.cannot_delete_comment"))
	}

	// Soft delete comment
	if err := uc.commentRepo.SoftDelete(ctx, commentID, userID); err != nil {
		return errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *UseCase) AddReaction(ctx context.Context, commentID bson.ObjectID, req *dto.AddReactionRequest, userID bson.ObjectID, lang string) (*dto.CommentResponse, error) {
	// Get comment
	comment, err := uc.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	if !comment.IsVisible() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Get task to check board access
	task, err := uc.taskRepo.GetByID(ctx, comment.TaskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Create reaction
	reaction := entities.CommentReaction{
		UserID:  userID,
		Emoji:   req.Emoji,
		AddedAt: time.Now(),
	}

	// Add reaction using repository method (handles duplicates)
	if err := uc.commentRepo.AddReaction(ctx, commentID, reaction); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated comment with details
	commentDetail, err := uc.getCommentWithDetails(ctx, commentID, lang)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapCommentToResponse(commentDetail, userID), nil
}

func (uc *UseCase) RemoveReaction(ctx context.Context, commentID bson.ObjectID, emoji string, userID bson.ObjectID, lang string) (*dto.CommentResponse, error) {
	// Get comment
	comment, err := uc.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	if !comment.IsVisible() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Get task to check board access
	task, err := uc.taskRepo.GetByID(ctx, comment.TaskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.comment_not_found"))
	}

	// Remove reaction
	if err := uc.commentRepo.RemoveReaction(ctx, commentID, userID, emoji); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated comment with details
	commentDetail, err := uc.getCommentWithDetails(ctx, commentID, lang)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapCommentToResponse(commentDetail, userID), nil
}

func (uc *UseCase) GetUserMentions(ctx context.Context, filter CommentQueryFilter, userID bson.ObjectID, lang string) (*utils.Page[*dto.CommentResponse], error) {
	// Convert query filter to repository filter
	repoFilter := uc.convertQueryFilter(filter)

	// Get mentions
	comments, total, err := uc.commentRepo.GetMentionsForUser(ctx, userID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Convert to detailed comments and filter by board access
	commentResponses := make([]*dto.CommentResponse, 0, len(comments))
	for _, comment := range comments {
		// Get task to check board access
		if task, err := uc.taskRepo.GetByID(ctx, comment.TaskID); err == nil {
			// Check if user still has access to the board
			if member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID); err == nil && member.IsActive() {
				if commentDetail, err := uc.getCommentWithDetails(ctx, comment.ID, lang); err == nil {
					commentResponses = append(commentResponses, uc.mapCommentToResponse(commentDetail, userID))
				}
			}
		}
	}

	return utils.NewPage(commentResponses, &filter.BaseFilter, total), nil
}
