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

type messageRepository struct {
	collection *mongo.Collection
}

func NewMessageRepository(db *mongo.Database) repositories.CommentRepository {
	collection := db.Collection("comment")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "task_id", Value: 1}}},
		{Keys: bson.D{{Key: "author_id", Value: 1}}},
		{Keys: bson.D{{Key: "created_at", Value: -1}}},
		// Text index for search
		{Keys: bson.D{{Key: "content", Value: "text"}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &messageRepository{collection: collection}
}

func (r *messageRepository) Create(ctx context.Context, message *entities.Comment) error {
	message.ID = bson.NewObjectID()
	message.CreatedAt = time.Now()
	message.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, message)
	return err
}

func (r *messageRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Comment, error) {
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

func (r *messageRepository) Update(ctx context.Context, message *entities.Comment) error {
	message.UpdatedAt = time.Now()

	filter := bson.M{"_id": message.ID}
	update := bson.M{"$set": message}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("message not found")
	}

	return nil
}

func (r *messageRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("message not found")
	}

	return nil
}

func (r *messageRepository) GetByTask(ctx context.Context, taskID bson.ObjectID, limit, offset int) ([]*entities.Comment, error) {
	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "created_at", Value: 1}}) // Oldest first for messages

	cursor, err := r.collection.Find(ctx, bson.M{"task_id": taskID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []*entities.Comment
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, err
	}

	return messages, nil
}

func (r *messageRepository) CountByTask(ctx context.Context, taskID bson.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"task_id": taskID})
}

func (r *messageRepository) DeleteByTask(ctx context.Context, taskID bson.ObjectID) error {
	_, err := r.collection.DeleteMany(ctx, bson.M{"task_id": taskID})
	return err
}
