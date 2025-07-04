package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardMember struct {
	*Base `bson:",inline"`

	UserID  bson.ObjectID `bson:"userId"`
	BoardID bson.ObjectID `bson:"boardId"`
	Role    BoardRole     `bson:"role"`
	Status  MemberStatus  `bson:"status"`

	InvitedBy    bson.ObjectID `bson:"invitedBy,omitempty"`
	InvitedAt    time.Time     `bson:"invitedAt"`
	LastActiveAt *time.Time    `bson:"lastActiveAt,omitempty"`

	NotificationSettings NotificationSettings `bson:"notificationSettings"`
}

type NotificationSettings struct {
	ReceiveTaskUpdates   bool `bson:"receiveTaskUpdates"`
	ReceiveMentions      bool `bson:"receiveMentions"`
	ReceiveComments      bool `bson:"receiveComments"`
	ReceiveBoardActivity bool `bson:"receiveBoardActivity"`
}

func GetDefaultNotificationSettings() NotificationSettings {
	return NotificationSettings{
		ReceiveTaskUpdates:   true,
		ReceiveMentions:      true,
		ReceiveComments:      true,
		ReceiveBoardActivity: true,
	}
}

// Business methods for BoardMember
func (bm *BoardMember) IsOwner() bool {
	return bm.Role == BoardRoleOwner
}

func (bm *BoardMember) IsAdmin() bool {
	return bm.Role == BoardRoleAdmin || bm.Role == BoardRoleOwner
}

func (bm *BoardMember) CanManageMembers() bool {
	return bm.Role == BoardRoleOwner || bm.Role == BoardRoleAdmin
}

func (bm *BoardMember) CanInviteMembers() bool {
	return bm.Role == BoardRoleOwner || bm.Role == BoardRoleAdmin || bm.Role == BoardRoleMember
}

func (bm *BoardMember) IsActive() bool {
	return bm.Status == MemberStatusAccepted
}

func (bm *BoardMember) IsPending() bool {
	return bm.Status == MemberStatusPending
}

func (bm *BoardMember) Accept() {
	bm.Status = MemberStatusAccepted
	bm.UpdateTimestamp()
}

func (bm *BoardMember) Revoke() {
	bm.Status = MemberStatusRevoked
	bm.UpdateTimestamp()
}

func (bm *BoardMember) Remove() {
	bm.Status = MemberStatusRemoved
	bm.UpdateTimestamp()
}

func (bm *BoardMember) UpdateLastActivity() {
	now := time.Now()
	bm.LastActiveAt = &now
	bm.UpdateTimestamp()
}
