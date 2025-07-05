package mongodb

import (
	"context"
	"errors"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type commentRepository struct {
	collection *mongo.Collection
}

func NewCommentRepository(db *Connection) repositories.CommentRepository {
	collection := db.GetCollection("comments")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "taskId", Value: 1}}},
		{Keys: bson.D{{Key: "taskId", Value: 1}, {Key: "createdAt", Value: 1}}},
		{Keys: bson.D{{Key: "authorId", Value: 1}}},
		{Keys: bson.D{{Key: "authorId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "mentions", Value: 1}}},
		{Keys: bson.D{{Key: "mentions", Value: 1}, {Key: "createdAt", Value: 1}}},
		{Keys: bson.D{{Key: "type", Value: 1}}},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "reactions.userId", Value: 1}, {Key: "reactions.emoji", Value: 1}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &commentRepository{collection: collection}
}

func (r *commentRepository) Create(ctx context.Context, message *entities.Comment) error {
	_, err := r.collection.InsertOne(ctx, message)
	return err
}

func (r *commentRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Comment, error) {
	var message entities.Comment
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&message)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("message not found")
		}
		return nil, err
	}
	return &message, nil
}

func (r *commentRepository) GetByAuthor(ctx context.Context, authorID bson.ObjectID, filter repositories.CommentFilter) ([]*entities.Comment, int64, error) {
	mongoFilter := r.buildCommentFilter(bson.NilObjectID, filter)
	mongoFilter["authorId"] = authorID

	// Count total
	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, err
	}

	// Build options
	opts := r.buildFindOptions(filter)

	// Execute query
	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var comments []*entities.Comment
	if err := cursor.All(ctx, &comments); err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) GetByTask(ctx context.Context, taskID bson.ObjectID, filter repositories.CommentFilter) ([]*entities.Comment, int64, error) {
	mongoFilter := r.buildCommentFilter(taskID, filter)

	// Count total
	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, err
	}

	// Build options
	opts := r.buildFindOptions(filter)

	// Execute query
	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var comments []*entities.Comment
	if err := cursor.All(ctx, &comments); err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) GetCommentsWithDetails(ctx context.Context, taskID bson.ObjectID, filter repositories.CommentFilter) ([]*repositories.CommentWithDetails, error) {
	pipeline := []bson.M{
		{
			"$match": r.buildCommentFilter(taskID, filter),
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "authorId",
				"foreignField": "_id",
				"as":           "author",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "mentions",
				"foreignField": "_id",
				"as":           "mentionedUsers",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "tasks",
				"localField":   "taskId",
				"foreignField": "_id",
				"as":           "task",
			},
		},
		{
			"$addFields": bson.M{
				"author": bson.M{"$arrayElemAt": []interface{}{"$author", 0}},
				"task":   bson.M{"$arrayElemAt": []interface{}{"$task", 0}},
			},
		},
	}

	// Add sorting
	sortOrder := 1 // Default ascending (oldest first)
	if filter.SortOrder == "desc" {
		sortOrder = -1
	}
	pipeline = append(pipeline, bson.M{"$sort": bson.D{{Key: "createdAt", Value: sortOrder}}})

	// Add pagination
	if filter.Page > 0 && filter.Limit > 0 {
		skip := (filter.Page - 1) * filter.Limit
		pipeline = append(pipeline,
			bson.M{"$skip": skip},
			bson.M{"$limit": filter.Limit},
		)
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		Comment        *entities.Comment `bson:",inline"`
		Author         *entities.User    `bson:"author"`
		MentionedUsers []*entities.User  `bson:"mentionedUsers"`
		Task           *entities.Task    `bson:"task"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	commentsWithDetails := make([]*repositories.CommentWithDetails, len(results))
	for i, result := range results {
		commentsWithDetails[i] = &repositories.CommentWithDetails{
			Comment:        result.Comment,
			Author:         result.Author,
			MentionedUsers: result.MentionedUsers,
			Task:           result.Task,
		}
	}

	return commentsWithDetails, nil
}

func (r *commentRepository) GetMentionsForUser(ctx context.Context, userID bson.ObjectID, filter repositories.CommentFilter) ([]*entities.Comment, int64, error) {
	mongoFilter := r.buildCommentFilter(bson.NilObjectID, filter)
	mongoFilter["mentions"] = bson.M{"$in": []bson.ObjectID{userID}}

	// Count total
	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, err
	}

	// Build options
	opts := r.buildFindOptions(filter)

	// Execute query
	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var comments []*entities.Comment
	if err := cursor.All(ctx, &comments); err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *commentRepository) Update(ctx context.Context, comment *entities.Comment) error {
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": comment.ID}, comment)
	return err
}

func (r *commentRepository) AddReaction(ctx context.Context, commentID bson.ObjectID, reaction entities.CommentReaction) error {
	// First remove any existing reaction from the same user with the same emoji
	removeUpdate := bson.M{
		"$pull": bson.M{
			"reactions": bson.M{
				"userId": reaction.UserID,
				"emoji":  reaction.Emoji,
			},
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": commentID}, removeUpdate)
	if err != nil {
		return err
	}

	// Add the new reaction
	addUpdate := bson.M{
		"$push": bson.M{
			"reactions": reaction,
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": commentID}, addUpdate)
	return err
}

func (r *commentRepository) RemoveReaction(ctx context.Context, commentID bson.ObjectID, userID bson.ObjectID, emoji string) error {
	update := bson.M{
		"$pull": bson.M{
			"reactions": bson.M{
				"userId": userID,
				"emoji":  emoji,
			},
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": commentID}, update)
	return err
}

func (r *commentRepository) CountByTask(ctx context.Context, taskID bson.ObjectID) (int64, error) {
	filter := bson.M{
		"taskId":    taskID,
		"isDeleted": false,
	}

	return r.collection.CountDocuments(ctx, filter)
}

func (r *commentRepository) SoftDelete(ctx context.Context, id bson.ObjectID, userID bson.ObjectID) error {
	update := bson.M{
		"$set": bson.M{
			"isDeleted": true,
			"updatedAt": time.Now(),
		},
	}

	filter := bson.M{
		"_id":      id,
		"authorId": userID, // Only author can delete their comment
	}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *commentRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *commentRepository) buildCommentFilter(taskID bson.ObjectID, filter repositories.CommentFilter) bson.M {
	mongoFilter := bson.M{}

	if !taskID.IsZero() {
		mongoFilter["taskId"] = taskID
	}

	if filter.Type != "" {
		mongoFilter["type"] = filter.Type
	}

	if filter.AuthorID != nil {
		mongoFilter["authorId"] = *filter.AuthorID
	}

	if filter.IsDeleted != nil {
		mongoFilter["isDeleted"] = *filter.IsDeleted
	} else {
		// Default to not deleted
		mongoFilter["isDeleted"] = false
	}

	return mongoFilter
}

func (r *commentRepository) buildFindOptions(filter repositories.CommentFilter) *options.FindOptionsBuilder {
	opts := options.Find()

	// Sorting (default to ascending by creation time)
	sortOrder := 1
	if filter.SortOrder == "desc" {
		sortOrder = -1
	}
	opts.SetSort(bson.D{{Key: "createdAt", Value: sortOrder}})

	// Pagination
	if filter.Page > 0 && filter.Limit > 0 {
		skip := int64((filter.Page - 1) * filter.Limit)
		opts.SetSkip(skip)
		opts.SetLimit(int64(filter.Limit))
	}

	return opts
}
