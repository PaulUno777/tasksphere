package domain

type CategoryRepository interface {
	Create(category *Category) error
	FindByBoardID(boardID string) ([]Category, error)
	Delete(id string) error
}
