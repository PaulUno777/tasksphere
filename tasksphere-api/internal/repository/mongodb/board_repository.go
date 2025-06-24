package mongodb

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type boardMongoRepo struct {
	collection *mongo.Collection
}

func NewBoardMongoRepo(db *mongo.Database) domain.BoardRepository {
	return &boardMongoRepo{
		collection: db.Collection("board"),
	}
}

func (repo *boardMongoRepo) Create(board *domain.Board) error {
	_, err := repo.collection.InsertOne(context.TODO(), board)
	return err
}

func (repo *boardMongoRepo) FindByID(id string) (*domain.Board, error) {
	var board domain.Board
	err := repo.collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&board)
	if err != nil {
		return nil, err
	}
	return &board, nil
}

func (repo *boardMongoRepo) FindByOwnerID(ownerID string) ([]domain.Board, error) {
	cursor, err := repo.collection.Find(context.TODO(), bson.M{"ownerId": ownerID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var boards []domain.Board
	if err := cursor.All(context.TODO(), &boards); err != nil {
		return nil, err
	}
	return boards, nil
}

func (repo *boardMongoRepo) Delete(id string) error {
	_, err := repo.collection.DeleteOne(
		context.TODO(),
		bson.M{"_id": id},
	)
	return err
}
