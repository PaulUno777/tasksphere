package mongodb

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type userMongoRepo struct {
	collection *mongo.Collection
}

func NewUserMongoRepo(db *mongo.Database) domain.UserRepository {
	return &userMongoRepo{
		collection: db.Collection("users"),
	}
}

func (repo *userMongoRepo) Create(user *domain.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err := repo.collection.InsertOne(context.TODO(), user)
	return err
}

func (repo *userMongoRepo) FindByEmail(email string) (*domain.User, error) {
	var user domain.User
	err := repo.collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (repo *userMongoRepo) FindByID(id string) (*domain.User, error) {
	oid, err := bson.ObjectIDFromHex(id)

	if err != nil {
		return nil, err
	}

	var user domain.User
	err = repo.collection.FindOne(context.TODO(), bson.M{"_id": oid}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (repo *userMongoRepo) UpdateRefreshToken(id string, token *string) error {
	_, err := repo.collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"refreshToken": token, "updatedAt": time.Now()}},
	)
	return err
}

func (repo *userMongoRepo) Update(user *domain.User) error {
	update := bson.M{
		"$set": bson.M{
			"firstName":    user.FirstName,
			"lastName":     user.LastName,
			"passwordHash": user.PasswordHash,
			"refreshToken": user.RefreshToken,
			"updatedAt":    user.UpdatedAt,
		},
	}
	_, err := repo.collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": user.ID},
		update,
	)
	return err
}
