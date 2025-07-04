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

func NewBoardRepository(db *Connection) repositories.BoardRepository {
	collection := db.GetCollection("boards")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "ownerId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "title", Value: "text"}, {Key: "description", Value: "text"}},
		},
		{
			Keys: bson.D{{Key: "createdAt", Value: -1}},
		},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &boardRepository{collection: collection}
}

func (b *boardRepository) Create(ctx context.Context, board *entities.Board) error {
	_, err := b.collection.InsertOne(ctx, board)
	if err != nil {
		return err
	}

	return nil
}

func (b *boardRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Board, error) {
	var board entities.Board
	err := b.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&board)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("Board not found")
		}
		return nil, err
	}

	return &board, nil
}

func (b *boardRepository) GetByMember(ctx context.Context, userID bson.ObjectID, status entities.BoardStatus) ([]*entities.Board, error) {
	pipeline := []bson.M{
		{
			"$lookup": bson.M{
				"from":         "board_members",
				"localField":   "_id",
				"foreignField": "boardId",
				"as":           "members",
			},
		},
		{
			"$match": bson.M{
				"members": bson.M{
					"$elemMatch": bson.M{
						"userId": userID,
						"status": entities.MemberStatusAccepted,
					},
				},
			},
		},
	}

	if status != "" {
		pipeline = append(pipeline, bson.M{"$match": bson.M{"status": status}})
	}

	pipeline = append(pipeline, bson.M{"$sort": bson.D{{Key: "createdAt", Value: -1}}})

	cursor, err := b.collection.Aggregate(ctx, pipeline)
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

// GetByOwner implements repositories.BoardRepository.
func (b *boardRepository) GetByOwner(ctx context.Context, ownerID bson.ObjectID, status entities.BoardStatus) ([]*entities.Board, error) {
	filter := bson.M{"ownerId": ownerID}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := b.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
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

// GetStats implements repositories.BoardRepository.
func (r *boardRepository) GetStats(ctx context.Context, boardID bson.ObjectID) (*entities.BoardStats, error) {
	pipeline := []bson.M{
		{
			"$match": bson.M{"_id": boardID},
		},
		{
			"$lookup": bson.M{
				"from":         "tasks",
				"localField":   "_id",
				"foreignField": "boardId",
				"as":           "tasks",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "board_members",
				"localField":   "_id",
				"foreignField": "boardId",
				"as":           "members",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "board_invitations",
				"localField":   "_id",
				"foreignField": "boardId",
				"as":           "invitations",
			},
		},
		{
			"$project": bson.M{
				"totalTasks": bson.M{"$size": "$tasks"},
				"completedTasks": bson.M{
					"$size": bson.M{
						"$filter": bson.M{
							"input": "$tasks",
							"cond": bson.M{
								"$eq": []interface{}{"$this.status", "COMPLETED"},
							},
						},
					},
				},
				"overdueTasks": bson.M{
					"$size": bson.M{
						"$filter": bson.M{
							"input": "$tasks",
							"cond": bson.M{
								"$and": []bson.M{
									{"$ne": []interface{}{"$this.dueDate", nil}},
									{"$lt": []interface{}{"$this.dueDate", time.Now()}},
									{"$ne": []interface{}{"$this.status", "COMPLETED"}},
								},
							},
						},
					},
				},
				"totalMembers": bson.M{"$size": "$members"},
				"activeMembers": bson.M{
					"$size": bson.M{
						"$filter": bson.M{
							"input": "$members",
							"cond": bson.M{
								"$eq": []interface{}{"$this.status", entities.MemberStatusAccepted},
							},
						},
					},
				},
				"pendingInvites": bson.M{
					"$size": bson.M{
						"$filter": bson.M{
							"input": "$invitations",
							"cond": bson.M{
								"$eq": []interface{}{"$this.status", entities.InvitationStatusPending},
							},
						},
					},
				},
				"lastActivity": bson.M{
					"$max": bson.M{
						"$concatArrays": []interface{}{
							"$tasks.updatedAt",
							"$members.updatedAt",
							[]interface{}{"$updatedAt"},
						},
					},
				},
				"createdThisWeek": bson.M{
					"$size": bson.M{
						"$filter": bson.M{
							"input": "$tasks",
							"cond": bson.M{
								"$gte": []interface{}{
									"$this.createdAt",
									time.Now().AddDate(0, 0, -7),
								},
							},
						},
					},
				},
				"updatedThisWeek": bson.M{
					"$size": bson.M{
						"$filter": bson.M{
							"input": "$tasks",
							"cond": bson.M{
								"$gte": []interface{}{
									"$this.updatedAt",
									time.Now().AddDate(0, 0, -7),
								},
							},
						},
					},
				},
			},
		},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []entities.BoardStats
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return &entities.BoardStats{}, nil
	}

	return &results[0], nil
}

// Update implements repositories.BoardRepository.
func (b *boardRepository) Update(ctx context.Context, board *entities.Board) error {
	_, err := b.collection.ReplaceOne(ctx, bson.M{"_id": board.ID}, board)
	return err
}

// UpdateSettings implements repositories.BoardRepository.
func (b *boardRepository) UpdateSettings(ctx context.Context, boardID bson.ObjectID, settings entities.BoardSettings) error {
	update := bson.M{
		"$set": bson.M{
			"settings":  settings,
			"updatedAt": time.Now(),
		},
	}

	_, err := b.collection.UpdateOne(ctx, bson.M{"_id": boardID}, update)
	return err
}

// Delete implements repositories.BoardRepository.
func (r *boardRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// List implements repositories.BoardRepository.
func (r *boardRepository) List(ctx context.Context, userID bson.ObjectID, filter repositories.BoardFilter) ([]*entities.Board, int64, error) {
	matchConditions := []bson.M{
		{
			"members": bson.M{
				"$elemMatch": bson.M{
					"userId": userID,
					"status": entities.MemberStatusAccepted,
				},
			},
		},
	}

	if filter.Status != "" {
		matchConditions = append(matchConditions, bson.M{"status": filter.Status})
	}

	if filter.Search != "" {
		matchConditions = append(matchConditions, bson.M{
			"$or": []bson.M{
				{"title": bson.M{"$regex": filter.Search, "$options": "i"}},
				{"description": bson.M{"$regex": filter.Search, "$options": "i"}},
			},
		})
	}

	// Aggregate pipeline with lookup for members
	pipeline := []bson.M{
		{
			"$lookup": bson.M{
				"from":         "board_members",
				"localField":   "_id",
				"foreignField": "boardId",
				"as":           "members",
			},
		},
		{
			"$match": bson.M{"$and": matchConditions},
		},
		{
			"$sort": bson.D{{Key: "createdAt", Value: -1}},
		},
	}

	// Count total
	countPipeline := append(pipeline, bson.M{"$count": "total"})
	countCursor, err := r.collection.Aggregate(ctx, countPipeline)
	if err != nil {
		return nil, 0, err
	}
	defer countCursor.Close(ctx)

	var countResult []bson.M
	if err := countCursor.All(ctx, &countResult); err != nil {
		return nil, 0, err
	}

	var total int64
	if len(countResult) > 0 {
		total = int64(countResult[0]["total"].(int32))
	}

	// Add pagination
	if filter.Page > 0 && filter.Limit > 0 {
		skip := (filter.Page - 1) * filter.Limit
		pipeline = append(pipeline,
			bson.M{"$skip": skip},
			bson.M{"$limit": filter.Limit},
		)
	}

	// Execute query
	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var boards []*entities.Board
	if err := cursor.All(ctx, &boards); err != nil {
		return nil, 0, err
	}

	return boards, total, nil
}
