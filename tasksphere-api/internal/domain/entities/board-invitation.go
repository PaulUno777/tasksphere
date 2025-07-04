package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// BoardInvitation represents a board invitation
type BoardInvitation struct {
	*Base `bson:",inline"`

	BoardID    bson.ObjectID    `bson:"boardId"`
	Email      string           `bson:"email"`
	Role       BoardRole        `bson:"role"`
	InvitedBy  bson.ObjectID    `bson:"invitedBy"`
	Status     InvitationStatus `bson:"status"`
	Token      string           `bson:"token"`
	ExpiresAt  time.Time        `bson:"expiresAt"`
	AcceptedAt *time.Time       `bson:"acceptedAt,omitempty"`
	RejectedAt *time.Time       `bson:"rejectedAt,omitempty"`
}

// Business methods for BoardInvitation
func (bi *BoardInvitation) IsExpired() bool {
	return time.Now().After(bi.ExpiresAt)
}

func (bi *BoardInvitation) IsPending() bool {
	return bi.Status == InvitationStatusPending && !bi.IsExpired()
}

func (bi *BoardInvitation) Accept() {
	bi.Status = InvitationStatusAccepted
	now := time.Now()
	bi.AcceptedAt = &now
	bi.UpdateTimestamp()
}

func (bi *BoardInvitation) Reject() {
	bi.Status = InvitationStatusRejected
	now := time.Now()
	bi.RejectedAt = &now
	bi.UpdateTimestamp()
}

func (bi *BoardInvitation) MarkExpired() {
	bi.Status = InvitationStatusExpired
	bi.UpdateTimestamp()
}
