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

func NewBoardMemberRepository(db *Connection) repositories.BoardMemberRepository {
	collection := db.GetCollection("board_members")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "boardId", Value: 1}, {Key: "userId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "userId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "boardId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "role", Value: 1}},
		},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &boardMemberRepository{collection: collection}
}

func (r *boardMemberRepository) Create(ctx context.Context, member *entities.BoardMember) error {
	_, err := r.collection.InsertOne(ctx, member)
	return err
}

func (r *boardMemberRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.BoardMember, error) {
	var member entities.BoardMember
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("member not found")
		}
		return nil, err
	}
	return &member, err
}

func (r *boardMemberRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID, status entities.MemberStatus) ([]*entities.BoardMember, error) {
	filter := bson.M{"boardId": boardID}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}}))
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

func (r *boardMemberRepository) GetByBoardAndUser(ctx context.Context, boardID bson.ObjectID, userID bson.ObjectID) (*entities.BoardMember, error) {
	var member entities.BoardMember
	err := r.collection.FindOne(ctx, bson.M{"boardId": boardID, "userId": userID}).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("member not found")
		}
		return nil, err
	}
	return &member, err
}

// GetByUser implements repositories.BoardMemberRepository.
func (r *boardMemberRepository) GetByUser(ctx context.Context, userID bson.ObjectID, status entities.MemberStatus) ([]*entities.BoardMember, error) {
	filter := bson.M{"userId": userID}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
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

// GetMembersWithUserInfo implements repositories.BoardMemberRepository.
func (r *boardMemberRepository) GetMembersWithUserInfo(ctx context.Context, boardID bson.ObjectID) ([]*repositories.MemberWithUserInfo, error) {
	pipeline := []bson.M{
		{
			"$match": bson.M{"boardId": boardID},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "userId",
				"foreignField": "_id",
				"as":           "user",
			},
		},
		{
			"$unwind": "$user",
		},
		{
			"$sort": bson.D{{Key: "createdAt", Value: 1}},
		},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		Member *entities.BoardMember `bson:",inline"`
		User   *entities.User        `bson:"user"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	membersWithInfo := make([]*repositories.MemberWithUserInfo, len(results))
	for i, result := range results {
		membersWithInfo[i] = &repositories.MemberWithUserInfo{
			Member: result.Member,
			User:   result.User,
		}
	}

	return membersWithInfo, nil
}

func (r *boardMemberRepository) CountByBoard(ctx context.Context, boardID bson.ObjectID, status entities.MemberStatus) (int64, error) {
	filter := bson.M{"boardId": boardID}
	if status != "" {
		filter["status"] = status
	}

	return r.collection.CountDocuments(ctx, filter)
}

func (r *boardMemberRepository) Update(ctx context.Context, member *entities.BoardMember) error {
	member.UpdateTimestamp()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": member.ID}, member)
	return err
}

func (r *boardMemberRepository) UpdateNotificationSettings(ctx context.Context, memberID bson.ObjectID, settings entities.NotificationSettings) error {
	update := bson.M{
		"$set": bson.M{
			"notificationSettings": settings,
			"updatedAt":            time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": memberID}, update)
	return err
}

func (r *boardMemberRepository) UpdateRole(ctx context.Context, memberID bson.ObjectID, role entities.BoardRole) error {
	update := bson.M{
		"$set": bson.M{
			"role":      role,
			"updatedAt": time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": memberID}, update)
	return err
}

func (r *boardMemberRepository) UpdateStatus(ctx context.Context, memberID bson.ObjectID, status entities.MemberStatus) error {
	update := bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": memberID}, update)
	return err
}

func (r *boardMemberRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

