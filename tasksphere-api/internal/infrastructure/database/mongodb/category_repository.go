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

func NewCategoryRepository(db *Connection) repositories.CategoryRepository {
	collection := db.GetCollection("categories")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "boardId", Value: 1}}},
		{Keys: bson.D{{Key: "boardId", Value: 1}, {Key: "position", Value: 1}}},
		{Keys: bson.D{{Key: "boardId", Value: 1}, {Key: "isActive", Value: 1}}},

		{
			Keys:    bson.D{{Key: "name", Value: 1}, {Key: "boardId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "createdBy", Value: -1}}},
		{Keys: bson.D{{Key: "createdBy", Value: 1}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &categoryRepository{collection: collection}
}

func (r *categoryRepository) Create(ctx context.Context, category *entities.Category) error {
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

func (r *categoryRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID, includeInactive bool) ([]*entities.Category, error) {
	filter := bson.M{"boardId": boardID}
	if !includeInactive {
		filter["isActive"] = true
	}

	opts := options.Find().SetSort(bson.D{{Key: "position", Value: 1}})
	cursor, err := r.collection.Find(ctx, filter, opts)
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

func (r *categoryRepository) GetByName(ctx context.Context, boardID bson.ObjectID, name string) (*entities.Category, error) {
	filter := bson.M{
		"boardId":  boardID,
		"name":     name,
		"isActive": true,
	}

	var category entities.Category
	err := r.collection.FindOne(ctx, filter).Decode(&category)
	if err != nil {
		return nil, err
	}

	return &category, nil
}

func (r *categoryRepository) GetCategoriesWithTaskCount(ctx context.Context, boardID bson.ObjectID) ([]*repositories.CategoryWithTaskCount, error) {
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"boardId":  boardID,
				"isActive": true,
			},
		},
		{
			"$lookup": bson.M{
				"from": "tasks",
				"let":  bson.M{"categoryId": "$_id"},
				"pipeline": []bson.M{
					{
						"$match": bson.M{
							"$expr": bson.M{
								"$and": []bson.M{
									{"$eq": []interface{}{"$categoryId", "$$categoryId"}},
									{"$ne": []interface{}{"$status", entities.TaskStatusArchived}},
								},
							},
						},
					},
					{"$count": "total"},
				},
				"as": "taskCount",
			},
		},
		{
			"$addFields": bson.M{
				"taskCount": bson.M{
					"$ifNull": []interface{}{
						bson.M{"$arrayElemAt": []interface{}{"$taskCount.total", 0}},
						0,
					},
				},
			},
		},
		{
			"$sort": bson.D{{Key: "position", Value: 1}},
		},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		Category  *entities.Category `bson:",inline"`
		TaskCount int64              `bson:"taskCount"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	categoriesWithCount := make([]*repositories.CategoryWithTaskCount, len(results))
	for i, result := range results {
		categoriesWithCount[i] = &repositories.CategoryWithTaskCount{
			Category:  result.Category,
			TaskCount: result.TaskCount,
		}
	}

	return categoriesWithCount, nil
}

func (r *categoryRepository) GetMaxPosition(ctx context.Context, boardID bson.ObjectID) (int, error) {
	pipeline := []bson.M{
		{
			"$match": bson.M{"boardId": boardID},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"maxPosition": bson.M{"$max": "$position"},
			},
		},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result struct {
		MaxPosition int `bson:"maxPosition"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return 0, err
		}
		return result.MaxPosition, nil
	}

	return 0, nil
}

func (r *categoryRepository) IsNameAvailable(ctx context.Context, boardID bson.ObjectID, name string, excludeID *bson.ObjectID) (bool, error) {
	filter := bson.M{
		"boardId":  boardID,
		"name":     name,
		"isActive": true,
	}

	if excludeID != nil {
		filter["_id"] = bson.M{"$ne": *excludeID}
	}

	count, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count == 0, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *entities.Category) error {
	category.UpdateTimestamp()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": category.ID}, category)
	return err
}

func (r *categoryRepository) UpdatePosition(ctx context.Context, categoryID bson.ObjectID, position int) error {
	update := bson.M{
		"$set": bson.M{
			"position":  position,
			"updatedAt": time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": categoryID}, update)
	return err
}

func (r *categoryRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
