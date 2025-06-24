package domain

type NotificationRepository interface {
	Create(notification *Notification) error
	FindByRecipientID(userID string) ([]Notification, error)
	MarkAsRead(id string) error
}
