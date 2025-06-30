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

type categoryRepository struct {
	collection *mongo.Collection
}

func NewCategoryRepository(db *mongo.Database) repositories.CategoryRepository {
	collection := db.Collection("categories")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "boardId", Value: 1}}},
		{
			Keys:    bson.D{{Key: "name", Value: 1}, {Key: "boardId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &categoryRepository{collection: collection}
}

func (r *categoryRepository) Create(ctx context.Context, category *entities.Category) error {
	category.ID = bson.NewObjectID()
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, category)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return errors.New("category with this name already exists in the board")
		}
		return err
	}
	return nil
}

func (r *categoryRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Category, error) {
	var category entities.Category
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&category)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("category not found")
		}
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *entities.Category) error {
	category.UpdatedAt = time.Now()

	filter := bson.M{"_id": category.ID}
	update := bson.M{"$set": category}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return errors.New("category with this name already exists in the board")
		}
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("category not found")
	}

	return nil
}

func (r *categoryRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("category not found")
	}

	return nil
}

func (r *categoryRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID) ([]*entities.Category, error) {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{"boardId": boardID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var categories []*entities.Category
	if err := cursor.All(ctx, &categories); err != nil {
		return nil, err
	}

	return categories, nil
}

func (r *categoryRepository) ExistsByNameAndBoard(ctx context.Context, name string, boardID bson.ObjectID) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{"name": name, "boardId": boardID})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *categoryRepository) GetByNameAndBoard(ctx context.Context, name string, boardID bson.ObjectID) (*entities.Category, error) {

	var category entities.Category
	filter := bson.M{
		"name":    name,
		"boardId": boardID,
	}
	err := r.collection.FindOne(ctx, filter).Decode(&category)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("category not found")
		}
		return nil, err
	}
	return &category, nil
}
