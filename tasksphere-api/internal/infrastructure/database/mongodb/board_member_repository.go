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

type boardMemberRepository struct {
	collection *mongo.Collection
}

func NewBoardMemberRepository(db *mongo.Database) repositories.BoardMemberRepository {
	collection := db.Collection("board_members")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "boardId", Value: 1}, {Key: "userId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "boardId", Value: 1}}},
		{Keys: bson.D{{Key: "userId", Value: 1}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &boardMemberRepository{collection: collection}
}

func (r *boardMemberRepository) Create(ctx context.Context, member *entities.BoardMember) error {
	member.ID = bson.NewObjectID()
	member.CreatedAt = time.Now()
	member.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, member)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return errors.New("user is already a member of this board")
		}
		return err
	}
	return nil
}

func (r *boardMemberRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.BoardMember, error) {
	var member entities.BoardMember
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("board member not found")
		}
		return nil, err
	}
	return &member, nil
}

func (r *boardMemberRepository) GetByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) (*entities.BoardMember, error) {
	var member entities.BoardMember
	filter := bson.M{"boardId": boardID, "userId": userID}
	err := r.collection.FindOne(ctx, filter).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("board member not found")
		}
		return nil, err
	}
	return &member, nil
}

func (r *boardMemberRepository) Update(ctx context.Context, member *entities.BoardMember) error {
	filter := bson.M{"_id": member.ID}
	update := bson.M{"$set": member}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("board member not found")
	}

	return nil
}

func (r *boardMemberRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("board member not found")
	}

	return nil
}

func (r *boardMemberRepository) DeleteByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) error {
	filter := bson.M{"boardId": boardID, "userId": userID}
	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("board member not found")
	}

	return nil
}

func (r *boardMemberRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID) ([]*entities.BoardMember, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"boardId": boardID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []*entities.BoardMember
	if err := cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	return members, nil
}

func (r *boardMemberRepository) GetByUser(ctx context.Context, userID bson.ObjectID) ([]*entities.BoardMember, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []*entities.BoardMember
	if err := cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	return members, nil
}

func (r *boardMemberRepository) ExistsByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{"boardId": boardID, "user_id": userID})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *boardMemberRepository) CountByBoard(ctx context.Context, boardID bson.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"boardId": boardID})
}
