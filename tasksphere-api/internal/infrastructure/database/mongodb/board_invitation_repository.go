package mongodb

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type boardInvitationRepository struct {
	collection *mongo.Collection
}

func NewBoardInvitationRepository(db *Connection) repositories.BoardInvitationRepository {
	collection := db.GetCollection("board_invitations")

	// Create indexes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	indexModels := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "token", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "boardId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "email", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "expiresAt", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "boardId", Value: 1}, {Key: "email", Value: 1}},
			Options: options.Index().SetPartialFilterExpression(bson.D{{Key: "status", Value: "PENDING"}}),
		},
	}
	collection.Indexes().CreateMany(ctx, indexModels)

	return &boardInvitationRepository{collection: collection}
}

// Create implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) Create(ctx context.Context, invitation *entities.BoardInvitation) error {
	_, err := r.collection.InsertOne(ctx, invitation)
	return err
}

// GetByID implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.BoardInvitation, error) {
	var invitation entities.BoardInvitation
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&invitation)
	if err != nil {
		return nil, err
	}

	return &invitation, nil
}

// GetByBoard implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) GetByBoard(ctx context.Context, boardID bson.ObjectID, status entities.InvitationStatus) ([]*entities.BoardInvitation, error) {
	filter := bson.M{"boardId": boardID}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var invitations []*entities.BoardInvitation
	if err := cursor.All(ctx, &invitations); err != nil {
		return nil, err
	}

	return invitations, nil
}

// GetByEmail implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) GetByEmail(ctx context.Context, email string, status entities.InvitationStatus) ([]*entities.BoardInvitation, error) {
	filter := bson.M{"email": email}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var invitations []*entities.BoardInvitation
	if err := cursor.All(ctx, &invitations); err != nil {
		return nil, err
	}

	return invitations, nil
}

// GetByToken implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) GetByToken(ctx context.Context, token string) (*entities.BoardInvitation, error) {
	var invitation entities.BoardInvitation
	err := r.collection.FindOne(ctx, bson.M{"token": token}).Decode(&invitation)
	if err != nil {
		return nil, err
	}

	return &invitation, nil
}

// CountByBoard implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) CountByBoard(ctx context.Context, boardID bson.ObjectID, status entities.InvitationStatus) (int64, error) {
	filter := bson.M{"boardId": boardID}
	if status != "" {
		filter["status"] = status
	}

	return r.collection.CountDocuments(ctx, filter)
}

// Update implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) Update(ctx context.Context, invitation *entities.BoardInvitation) error {
	invitation.UpdateTimestamp()
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": invitation.ID}, invitation)
	return err
}

// Delete implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) Delete(ctx context.Context, id bson.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// ExpireOldInvitations implements repositories.BoardInvitationRepository.
func (r *boardInvitationRepository) ExpireOldInvitations(ctx context.Context) error {
	filter := bson.M{
		"status":    entities.InvitationStatusPending,
		"expiresAt": bson.M{"$lt": time.Now()},
	}

	update := bson.M{
		"$set": bson.M{
			"status":    entities.InvitationStatusExpired,
			"updatedAt": time.Now(),
		},
	}

	_, err := r.collection.UpdateMany(ctx, filter, update)
	return err
}
