package domain

type BoardMemberRepository interface {
	Add(member *BoardMember) error
	FindByBoardID(boardID string) ([]BoardMember, error)
	FindByUserID(userID string) ([]BoardMember, error)
	DeleteByUserAndBoard(userID, boardID string) error
}
