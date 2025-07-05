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

func NewTaskRepository(db *Connection) repositories.TaskRepository {
	collection := db.GetCollection("tasks")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{Keys: bson.D{{Key: "boardId", Value: 1}}},
		{Keys: bson.D{{Key: "boardId", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "boardId", Value: 1}, {Key: "status", Value: 1}, {Key: "position", Value: 1}}},
		{Keys: bson.D{{Key: "assignedTo", Value: 1}}},
		{Keys: bson.D{{Key: "assignedTo", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "categoryId", Value: 1}}},
		{Keys: bson.D{{Key: "createdBy", Value: 1}}},
		{Keys: bson.D{{Key: "lastEditedBy", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "priority", Value: 1}}},
		{Keys: bson.D{{Key: "dueDate", Value: 1}}},
		{Keys: bson.D{{Key: "dueDate", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "updatedAt", Value: -1}}},
		{Keys: bson.D{{Key: "completedAt", Value: -1}}},
		// Text index for search
		{Keys: bson.D{{Key: "title", Value: "text"}, {Key: "description", Value: "text"}}},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &taskRepository{collection: collection}
}

func (r *taskRepository) Create(ctx context.Context, task *entities.Task) error {
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

// GetByAssignee implements repositories.TaskRepository.
func (r *taskRepository) GetByAssignee(ctx context.Context, userID bson.ObjectID, filter repositories.TaskFilter) ([]*entities.Task, int64, error) {
	mongoFilter := r.buildTaskFilter(bson.NilObjectID, filter)
	mongoFilter["assignedTo"] = userID

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

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// GetByBoard implements repositories.TaskRepository.
func (r *taskRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID, filter repositories.TaskFilter) ([]*entities.Task, int64, error) {
	mongoFilter := r.buildTaskFilter(boardID, filter)
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

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// GetByCategory implements repositories.TaskRepository.
func (r *taskRepository) GetByCategory(ctx context.Context, categoryID bson.ObjectID, filter repositories.TaskFilter) ([]*entities.Task, int64, error) {
	mongoFilter := r.buildTaskFilter(bson.NilObjectID, filter)
	mongoFilter["categoryId"] = categoryID

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

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// GetOverdueTasks implements repositories.TaskRepository.
func (r *taskRepository) GetOverdueTasks(ctx context.Context, boardID bson.ObjectID) ([]*entities.Task, error) {
	filter := bson.M{
		"boardId": boardID,
		"dueDate": bson.M{"$lt": time.Now()},
		"status": bson.M{
			"$nin": []entities.TaskStatus{
				entities.TaskStatusCompleted,
				entities.TaskStatusArchived,
			},
		},
	}

	opts := options.Find().SetSort(bson.D{{Key: "dueDate", Value: 1}})
	cursor, err := r.collection.Find(ctx, filter, opts)
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

// GetTasksForKanban implements repositories.TaskRepository.
func (r *taskRepository) GetTasksForKanban(ctx context.Context, boardID bson.ObjectID) (map[entities.TaskStatus][]*entities.Task, error) {
	filter := bson.M{
		"boardId": boardID,
		"status": bson.M{
			"$in": []entities.TaskStatus{
				entities.TaskStatusToDo,
				entities.TaskStatusInProgress,
				entities.TaskStatusReview,
				entities.TaskStatusCompleted,
			},
		},
	}

	opts := options.Find().SetSort(bson.D{{Key: "position", Value: 1}})
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*entities.Task
	if err := cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	// Organize by status
	result := make(map[entities.TaskStatus][]*entities.Task)
	for _, task := range tasks {
		result[task.Status] = append(result[task.Status], task)
	}

	return result, nil
}

// GetTasksWithDetails implements repositories.TaskRepository.
func (r *taskRepository) GetTasksWithDetails(ctx context.Context, boardID bson.ObjectID, filter repositories.TaskFilter) ([]*repositories.TaskWithDetails, error) {
	pipeline := []bson.M{
		{
			"$match": r.buildTaskFilter(boardID, filter),
		},
		{
			"$lookup": bson.M{
				"from":         "boards",
				"localField":   "boardId",
				"foreignField": "_id",
				"as":           "board",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "categories",
				"localField":   "categoryId",
				"foreignField": "_id",
				"as":           "category",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "assignedTo",
				"foreignField": "_id",
				"as":           "assignedUser",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "createdBy",
				"foreignField": "_id",
				"as":           "creator",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "lastEditedBy",
				"foreignField": "_id",
				"as":           "lastEditor",
			},
		},
		{
			"$lookup": bson.M{
				"from": "comments",
				"let":  bson.M{"taskId": "$_id"},
				"pipeline": []bson.M{
					{
						"$match": bson.M{
							"$expr": bson.M{
								"$and": []bson.M{
									{"$eq": []interface{}{"$taskId", "$$taskId"}},
									{"$eq": []interface{}{"$isDeleted", false}},
								},
							},
						},
					},
					{"$count": "total"},
				},
				"as": "commentCount",
			},
		},
		{
			"$addFields": bson.M{
				"board":        bson.M{"$arrayElemAt": []interface{}{"$board", 0}},
				"category":     bson.M{"$arrayElemAt": []interface{}{"$category", 0}},
				"assignedUser": bson.M{"$arrayElemAt": []interface{}{"$assignedUser", 0}},
				"creator":      bson.M{"$arrayElemAt": []interface{}{"$creator", 0}},
				"lastEditor":   bson.M{"$arrayElemAt": []interface{}{"$lastEditor", 0}},
				"commentCount": bson.M{
					"$ifNull": []interface{}{
						bson.M{"$arrayElemAt": []interface{}{"$commentCount.total", 0}},
						0,
					},
				},
			},
		},
	}

	// Add sorting
	if filter.SortBy != "" {
		sortField := filter.SortBy
		sortOrder := 1
		if filter.SortOrder == "desc" {
			sortOrder = -1
		}
		pipeline = append(pipeline, bson.M{"$sort": bson.D{{Key: sortField, Value: sortOrder}}})
	} else {
		// Default sort by position
		pipeline = append(pipeline, bson.M{"$sort": bson.D{{Key: "position", Value: 1}}})
	}

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
		Task         *entities.Task     `bson:",inline"`
		Board        *entities.Board    `bson:"board"`
		Category     *entities.Category `bson:"category"`
		AssignedUser *entities.User     `bson:"assignedUser"`
		Creator      *entities.User     `bson:"creator"`
		LastEditor   *entities.User     `bson:"lastEditor"`
		CommentCount int64              `bson:"commentCount"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	tasksWithDetails := make([]*repositories.TaskWithDetails, len(results))
	for i, result := range results {
		tasksWithDetails[i] = &repositories.TaskWithDetails{
			Task:         result.Task,
			Board:        result.Board,
			Category:     result.Category,
			AssignedUser: result.AssignedUser,
			Creator:      result.Creator,
			LastEditor:   result.LastEditor,
			CommentCount: result.CommentCount,
		}
	}

	return tasksWithDetails, nil
}

// Update implements repositories.TaskRepository.
func (r *taskRepository) Update(ctx context.Context, task *entities.Task) error {
	task.UpdateTimestamp()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": task.ID}, task)
	return err
}

// UpdateAssignment implements repositories.TaskRepository.
func (r *taskRepository) UpdateAssignment(ctx context.Context, taskID bson.ObjectID, assignedTo *bson.ObjectID, userID bson.ObjectID) error {
	update := bson.M{
		"$set": bson.M{
			"lastEditedBy": userID,
			"updatedAt":    time.Now(),
		},
	}

	if assignedTo != nil {
		update["$set"].(bson.M)["assignedTo"] = *assignedTo
	} else {
		update["$unset"] = bson.M{"assignedTo": ""}
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": taskID}, update)
	return err
}

// UpdatePosition implements repositories.TaskRepository.
func (r *taskRepository) UpdatePosition(ctx context.Context, taskID bson.ObjectID, position int, status entities.TaskStatus, userID bson.ObjectID) error {
	update := bson.M{
		"$set": bson.M{
			"position":     position,
			"status":       status,
			"lastEditedBy": userID,
			"updatedAt":    time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": taskID}, update)
	return err
}

// UpdateStatus implements repositories.TaskRepository.
func (r *taskRepository) UpdateStatus(ctx context.Context, taskID bson.ObjectID, status entities.TaskStatus, userID bson.ObjectID) error {
	update := bson.M{
		"$set": bson.M{
			"status":       status,
			"lastEditedBy": userID,
			"updatedAt":    time.Now(),
		},
	}

	// Handle completion timestamp
	if status == entities.TaskStatusCompleted {
		update["$set"].(bson.M)["completedAt"] = time.Now()
	} else {
		update["$unset"] = bson.M{"completedAt": ""}
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": taskID}, update)
	return err
}

// CountByAssignee implements repositories.TaskRepository.
func (r *taskRepository) CountByAssignee(ctx context.Context, userID bson.ObjectID, status entities.TaskStatus) (int64, error) {
	filter := bson.M{"assignedTo": userID}
	if status != "" {
		filter["status"] = status
	}

	return r.collection.CountDocuments(ctx, filter)
}

// CountByBoard implements repositories.TaskRepository.
func (r *taskRepository) CountByBoard(ctx context.Context, boardID bson.ObjectID, status entities.TaskStatus) (int64, error) {
	filter := bson.M{"boardId": boardID}
	if status != "" {
		filter["status"] = status
	}

	return r.collection.CountDocuments(ctx, filter)
}

// CountByCategory implements repositories.TaskRepository.
func (r *taskRepository) CountByCategory(ctx context.Context, categoryID bson.ObjectID) (int64, error) {
	filter := bson.M{"categoryId": categoryID}
	return r.collection.CountDocuments(ctx, filter)
}

// Delete implements repositories.TaskRepository.
func (r *taskRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *taskRepository) buildTaskFilter(boardID bson.ObjectID, filter repositories.TaskFilter) bson.M {
	mongoFilter := bson.M{}

	if !boardID.IsZero() {
		mongoFilter["boardId"] = boardID
	}

	if filter.Status != "" {
		mongoFilter["status"] = filter.Status
	}

	if filter.Priority != "" {
		mongoFilter["priority"] = filter.Priority
	}

	if filter.AssignedTo != nil {
		mongoFilter["assignedTo"] = *filter.AssignedTo
	}

	if filter.CategoryID != nil {
		mongoFilter["categoryId"] = *filter.CategoryID
	}

	if filter.Search != "" {
		mongoFilter["$or"] = []bson.M{
			{"title": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"description": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	if filter.IsOverdue != nil && *filter.IsOverdue {
		mongoFilter["dueDate"] = bson.M{"$lt": time.Now()}
		mongoFilter["status"] = bson.M{
			"$nin": []entities.TaskStatus{
				entities.TaskStatusCompleted,
				entities.TaskStatusArchived,
			},
		}
	}

	if filter.DueBefore != nil {
		if mongoFilter["dueDate"] == nil {
			mongoFilter["dueDate"] = bson.M{}
		}
		mongoFilter["dueDate"].(bson.M)["$lte"] = *filter.DueBefore
	}

	if filter.DueAfter != nil {
		if mongoFilter["dueDate"] == nil {
			mongoFilter["dueDate"] = bson.M{}
		}
		mongoFilter["dueDate"].(bson.M)["$gte"] = *filter.DueAfter
	}

	return mongoFilter
}

func (r *taskRepository) buildFindOptions(filter repositories.TaskFilter) *options.FindOptionsBuilder {
	opts := options.Find()

	// Sorting
	sortField := "position"
	sortOrder := 1

	if filter.SortBy != "" {
		sortField = filter.SortBy
	}

	if filter.SortOrder == "desc" {
		sortOrder = -1
	}

	opts.SetSort(bson.D{{Key: sortField, Value: sortOrder}})

	// Pagination
	if filter.Page > 0 && filter.Limit > 0 {
		skip := int64((filter.Page - 1) * filter.Limit)
		opts.SetSkip(skip)
		opts.SetLimit(int64(filter.Limit))
	}

	return opts
}
