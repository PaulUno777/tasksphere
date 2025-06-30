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

type taskRepository struct {
	collection *mongo.Collection
}

func NewTaskRepository(db *mongo.Database) repositories.TaskRepository {
	collection := db.Collection("tasks")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "board_id", Value: 1}}},
		{Keys: bson.D{{Key: "assigned_to", Value: 1}}},
		{Keys: bson.D{{Key: "due_date", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "priority", Value: 1}}},
		{Keys: bson.D{{Key: "category_id", Value: 1}}},
		{Keys: bson.D{{Key: "created_at", Value: -1}}},
		// Text index for search
		{Keys: bson.D{{Key: "title", Value: "text"}, {Key: "description", Value: "text"}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &taskRepository{collection: collection}
}

func (r *taskRepository) Create(ctx context.Context, task *entities.Task) error {
	task.ID = bson.NewObjectID()
	task.CreatedAt = time.Now()
	task.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, task)
	return err
}

func (r *taskRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Task, error) {
	var task entities.Task
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&task)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("task not found")
		}
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) Update(ctx context.Context, task *entities.Task) error {
	task.UpdatedAt = time.Now()

	filter := bson.M{"_id": task.ID}
	update := bson.M{"$set": task}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("task not found")
	}

	return nil
}

func (r *taskRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("task not found")
	}

	return nil
}

func (r *taskRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID, limit, offset int) ([]*entities.Task, error) {
	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, bson.M{"boardId": boardID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *taskRepository) GetByAssignee(ctx context.Context, userID bson.ObjectID, limit, offset int) ([]*entities.Task, error) {
	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, bson.M{"assignedTo": userID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *taskRepository) GetOverdueTasks(ctx context.Context) ([]*entities.Task, error) {
	filter := bson.M{
		"dueDate": bson.M{"$lt": time.Now()},
		"status":  bson.M{"$nin": []string{"COMPLETED", "ARCHIVED"}},
	}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

// Advanced filtering method
func (r *taskRepository) GetByFilter(ctx context.Context, filter *repositories.TaskFilter, limit, offset int) ([]*entities.Task, error) {
	mongoFilter := r.buildTaskFilterQuery(filter)

	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSkip(int64(offset))
	opts.SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *taskRepository) buildTaskFilterQuery(filter *repositories.TaskFilter) bson.M {
	query := bson.M{}

	if filter.BoardID != nil {
		query["boardId"] = *filter.BoardID
	}

	if filter.AssignedTo != nil {
		query["assignedTo"] = *filter.AssignedTo
	}

	if filter.Status != nil {
		query["status"] = *filter.Status
	}

	if filter.Priority != nil {
		query["priority"] = *filter.Priority
	}

	if filter.CategoryID != nil {
		query["categoryId"] = *filter.CategoryID
	}

	// Date range filtering
	if filter.DueBefore != nil || filter.DueAfter != nil {
		dateFilter := bson.M{}
		if filter.DueBefore != nil {
			dateFilter["$lte"] = *filter.DueBefore
		}
		if filter.DueAfter != nil {
			dateFilter["$gte"] = *filter.DueAfter
		}
		query["dueDate"] = dateFilter
	}

	// Text search
	if filter.Search != "" {
		query["$text"] = bson.M{"$search": filter.Search}
	}

	// Archive filter
	if filter.IsArchived != nil {
		if *filter.IsArchived {
			query["status"] = "ARCHIVED"
		} else {
			query["status"] = bson.M{"$ne": "ARCHIVED"}
		}
	}

	return query
}

func (r *taskRepository) UpdateStatus(ctx context.Context, taskID bson.ObjectID, status entities.TaskStatus, updatedBy bson.ObjectID) error {
	filter := bson.M{"_id": taskID}
	update := bson.M{
		"$set": bson.M{
			"status":        status,
			"lastUpdatedBy": updatedBy,
			"updatedAt":     time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("task not found")
	}

	return nil
}

func (r *taskRepository) UpdateAssignee(ctx context.Context, taskID bson.ObjectID, assigneeID *bson.ObjectID, updatedBy bson.ObjectID) error {
	filter := bson.M{"_id": taskID}
	update := bson.M{
		"$set": bson.M{
			"assignedTo":    assigneeID,
			"lastUpdatedBy": updatedBy,
			"updatedAt":     time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("task not found")
	}

	return nil
}

func (r *taskRepository) GetTaskStats(ctx context.Context, boardID bson.ObjectID) (map[entities.TaskStatus]int64, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "boardId", Value: boardID}}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$status"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	stats := make(map[entities.TaskStatus]int64)
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			return nil, err
		}
		stats[entities.TaskStatus(result.ID)] = result.Count
	}

	return stats, nil
}

func (r *taskRepository) CountByBoard(ctx context.Context, boardID bson.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"boardId": boardID})
}

func (r *taskRepository) CountByStatus(ctx context.Context, boardID bson.ObjectID, status entities.TaskStatus) (int64, error) {
	filter := bson.M{"boardId": boardID, "status": status}
	return r.collection.CountDocuments(ctx, filter)
}

func (r *taskRepository) GetTasksByCategory(ctx context.Context, categoryID bson.ObjectID) ([]*entities.Task, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"categoryId": categoryID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *taskRepository) UpdateTasksCategory(ctx context.Context, categoryID bson.ObjectID, newCategoryID *bson.ObjectID) error {
	filter := bson.M{"categoryId": categoryID}
	update := bson.M{
		"$set": bson.M{
			"categoryId": newCategoryID,
			"updatedAt":  time.Now(),
		},
	}

	_, err := r.collection.UpdateMany(ctx, filter, update)
	return err
}
