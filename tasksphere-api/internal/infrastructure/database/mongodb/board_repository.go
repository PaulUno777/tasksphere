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

type boardRepository struct {
	collection *mongo.Collection
}

func NewBoardRepository(db *mongo.Database) repositories.BoardRepository {
	collection := db.Collection("boards")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "owner_id", Value: 1}}},
		{Keys: bson.D{{Key: "created_at", Value: -1}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &boardRepository{collection: collection}
}

func (r *boardRepository) Create(ctx context.Context, board *entities.Board) error {
	board.ID = bson.NewObjectID()
	board.CreatedAt = time.Now()
	board.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, board)
	return err
}

func (r *boardRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Board, error) {
	var board entities.Board
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&board)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("board not found")
		}
		return nil, err
	}
	return &board, nil
}

func (r *boardRepository) Update(ctx context.Context, board *entities.Board) error {
	board.UpdatedAt = time.Now()

	filter := bson.M{"_id": board.ID}
	update := bson.M{"$set": board}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("board not found")
	}

	return nil
}

func (r *boardRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("board not found")
	}

	return nil
}

func (r *boardRepository) GetByOwner(ctx context.Context, ownerID bson.ObjectID, limit, offset int) ([]*entities.Board, error) {
	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, bson.M{"owner_id": ownerID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var boards []*entities.Board
	if err := cursor.All(ctx, &boards); err != nil {
		return nil, err
	}

	return boards, nil
}

func (r *boardRepository) GetByMember(ctx context.Context, userID bson.ObjectID, limit, offset int) ([]*entities.Board, error) {
	// This requires aggregation to join with board_members collection
	pipeline := mongo.Pipeline{
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "board_members"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "board_id"},
			{Key: "as", Value: "members"},
		}}},
		{{Key: "$match", Value: bson.D{
			{Key: "members.user_id", Value: userID},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "created_at", Value: -1}}}},
		{{Key: "$skip", Value: offset}},
		{{Key: "$limit", Value: limit}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var boards []*entities.Board
	if err := cursor.All(ctx, &boards); err != nil {
		return nil, err
	}

	return boards, nil
}

func (r *boardRepository) ExistsByID(ctx context.Context, id bson.ObjectID) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
