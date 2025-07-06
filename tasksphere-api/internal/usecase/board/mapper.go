package board

import "github.com/PaulUno777/tasksphere-api/internal/pkg/utils"

type BoardQueryFilter struct {
	Search string
	Status string
	utils.BaseFilter
}
