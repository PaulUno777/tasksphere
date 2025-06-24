package domain

type BoardRepository interface {
	Create(board *Board) error
	FindByID(id string) (*Board, error)
	FindByOwnerID(ownerID string) ([]Board, error)
	Delete(id string) error
}
