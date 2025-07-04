package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Board struct {
	*Base `bson:",inline"`

	Title       string        `bson:"title"`
	Description *string       `bson:"description,omitempty"`
	OwnerID     bson.ObjectID `bson:"ownerId"`
	Color       *string       `bson:"color,omitempty"`
	Status      BoardStatus   `bson:"status"`
	ArchivedAt  *time.Time    `bson:"archivedAt,omitempty"`

	Settings BoardSettings `bson:"settings"`
}

// BoardSettings represents board configuration settings
type BoardSettings struct {
	AllowComments            bool `bson:"allowComments"`
	AutoArchiveCompletedDays int  `bson:"autoArchiveCompletedDays,omitempty"`
	RequireInviteApproval    bool `bson:"requireInviteApproval"`
	AllowMemberInvite        bool `bson:"allowMemberInvite"`
}

// BoardStats represents board statistics
type BoardStats struct {
	TotalTasks      int       `bson:"totalTasks"`
	CompletedTasks  int       `bson:"completedTasks"`
	OverdueTasks    int       `bson:"overdueTasks"`
	TotalMembers    int       `bson:"totalMembers"`
	ActiveMembers   int       `bson:"activeMembers"`
	PendingInvites  int       `bson:"pendingInvites"`
	LastActivity    time.Time `bson:"lastActivity"`
	CreatedThisWeek int       `bson:"createdThisWeek"`
	UpdatedThisWeek int       `bson:"updatedThisWeek"`
}

func GetDefaultBoardSettings() BoardSettings {
	return BoardSettings{
		AllowComments:            true,
		AutoArchiveCompletedDays: 0,
		RequireInviteApproval:    false,
		AllowMemberInvite:        true,
	}
}

// Business methods for Board
func (b *Board) IsOwner(userID bson.ObjectID) bool {
	return b.OwnerID == userID
}

func (b *Board) IsArchived() bool {
	return b.Status == BoardStatusArchived
}

func (b *Board) IsDeleted() bool {
	return b.Status == BoardStatusDeleted
}

func (b *Board) CanBeModified() bool {
	return b.Status == BoardStatusActive
}

func (b *Board) Archive() {
	b.Status = BoardStatusArchived
	now := time.Now()
	b.ArchivedAt = &now
	b.UpdateTimestamp()
}

func (b *Board) Restore() {
	b.Status = BoardStatusActive
	b.ArchivedAt = nil
	b.UpdateTimestamp()
}

func (b *Board) SoftDelete() {
	b.Status = BoardStatusDeleted
	b.UpdateTimestamp()
}
