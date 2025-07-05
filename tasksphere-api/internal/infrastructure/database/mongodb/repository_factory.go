package mongodb

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
)

type RepositoryFactory struct {
	db      *Connection
	timeout time.Duration
}

func NewRepositoryFactory(db *Connection, timeout time.Duration) *RepositoryFactory {
	return &RepositoryFactory{
		db:      db,
		timeout: timeout,
	}
}

func (f *RepositoryFactory) CreateUserRepository() repositories.UserRepository {
	return NewUserRepository(f.db)
}

func (f *RepositoryFactory) CreateBoardRepository() repositories.BoardRepository {
	return NewBoardRepository(f.db)
}

func (f *RepositoryFactory) CreateBoardMemberRepository() repositories.BoardMemberRepository {
	return NewBoardMemberRepository(f.db)
}

func (f *RepositoryFactory) CreateBoardInvitationRepository() repositories.BoardInvitationRepository {
	return NewBoardInvitationRepository(f.db)
}

func (f *RepositoryFactory) CreateTaskRepository() repositories.TaskRepository {
	return NewTaskRepository(f.db)
}

func (f *RepositoryFactory) CreateCategoryRepository() repositories.CategoryRepository {
	return NewCategoryRepository(f.db)
}

func (f *RepositoryFactory) CreateCommentRepository() repositories.CommentRepository {
	return NewCommentRepository(f.db)
}
