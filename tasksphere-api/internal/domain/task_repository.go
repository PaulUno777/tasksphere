package domain

type TaskRepository interface {
	Create(task *Task) error
	FindByBoardID(boardID string) ([]Task, error)
	FindByID(id string) (*Task, error)
	Update(task *Task) error
	Delete(id string) error
}
