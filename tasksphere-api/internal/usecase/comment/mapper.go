package comment

import (
	"context"
	"regexp"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CommentQueryFilter struct {
	Type      string
	AuthorID  string
	utils.BaseFilter
}

func (uc *UseCase) extractMentions(content string) []bson.ObjectID {
	// Simple regex for @mentions - in a real app, you might want more sophisticated parsing
	mentionRegex := regexp.MustCompile(`@([a-fA-F0-9]{24})`) // MongoDB ObjectID format
	matches := mentionRegex.FindAllStringSubmatch(content, -1)

	mentions := make([]bson.ObjectID, 0, len(matches))
	for _, match := range matches {
		if len(match) > 1 {
			if id, err := bson.ObjectIDFromHex(match[1]); err == nil {
				mentions = append(mentions, id)
			}
		}
	}

	return mentions
}

func (uc *UseCase) getCommentWithDetails(ctx context.Context, commentID bson.ObjectID, lang string) (*repositories.CommentWithDetails, error) {
	// Just fetch a single comment with details via aggregation
	commentWithDetails, err := uc.commentRepo.GetCommentWithDetails(ctx, commentID)
	if err != nil {
		return nil, err
	}
	if commentWithDetails == nil {
		return nil, errors.NewNotFoundError(
			uc.i18n.T(lang, "errors.comment_not_found"))
	}
	return commentWithDetails, nil
}

func (uc *UseCase) convertQueryFilter(filter CommentQueryFilter) repositories.CommentFilter {
	repoFilter := repositories.CommentFilter{
		Page:      filter.Page,
		Limit:     filter.Limit,
		SortOrder: filter.SortOrder,
	}

	// Set defaults
	if repoFilter.Page < 1 {
		repoFilter.Page = 1
	}
	if repoFilter.Limit < 1 || repoFilter.Limit > 100 {
		repoFilter.Limit = 20
	}
	if repoFilter.SortOrder == "" {
		repoFilter.SortOrder = "asc"
	}

	// Parse type
	if filter.Type != "" {
		repoFilter.Type = entities.CommentType(filter.Type)
	}

	// Parse author
	if filter.AuthorID != "" {
		if authorID, err := bson.ObjectIDFromHex(filter.AuthorID); err == nil {
			repoFilter.AuthorID = &authorID
		}
	}

	return repoFilter
}

func (uc *UseCase) mapCommentToResponse(commentDetail *repositories.CommentWithDetails, userID bson.ObjectID) *dto.CommentResponse {
	comment := commentDetail.Comment
	response := &dto.CommentResponse{
		ID:        comment.GetID(),
		Content:   comment.Content,
		Type:      string(comment.Type),
		IsEdited:  comment.IsEdited,
		CanEdit:   comment.CanBeEdited() && comment.AuthorID == userID,
		CanDelete: comment.AuthorID == userID, // Note: Admin deletion check would require board member info
		CreatedAt: comment.CreatedAt.Format(time.RFC3339),
		UpdatedAt: comment.UpdatedAt.Format(time.RFC3339),
	}

	// Add author info
	if commentDetail.Author != nil {
		response.Author = dto.UserToMinimal(commentDetail.Author)
	}

	// Add mentioned users
	if len(commentDetail.MentionedUsers) > 0 {
		mentions := make([]*dto.UserMinimal, len(commentDetail.MentionedUsers))
		for i, user := range commentDetail.MentionedUsers {
			mentions[i] = dto.UserToMinimal(user)
		}
		response.Mentions = mentions
	}

	// Add reactions with user info
	if len(comment.Reactions) > 0 {
		reactions := make([]*dto.CommentReactionResponse, len(comment.Reactions))
		for i, reaction := range comment.Reactions {
			// Get user info for reaction
			var reactionUser *dto.UserMinimal
			if user, err := uc.userRepo.GetByID(context.Background(), reaction.UserID); err == nil {
				reactionUser = dto.UserToMinimal(user)
			}

			reactions[i] = &dto.CommentReactionResponse{
				User:    reactionUser,
				Emoji:   reaction.Emoji,
				AddedAt: reaction.AddedAt.Format(time.RFC3339),
			}
		}
		response.Reactions = reactions
	}

	return response
}
