package domain

type MessageRepository interface {
	Create(message *Message) error
	FindByTaskID(taskID string) ([]Message, error)
}
