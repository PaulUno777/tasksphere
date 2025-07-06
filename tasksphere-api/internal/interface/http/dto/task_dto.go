package dto

// CreateTaskRequest represents task creation request
type CreateTaskRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=200"`
	Description string  `json:"description" validate:"omitempty,max=2000"`
	Priority    string  `json:"priority" validate:"omitempty,oneof=LOW NORMAL HIGH CRITICAL"`
	CategoryID  *string `json:"categoryId" validate:"omitempty,objectid"`
	AssignedTo  *string `json:"assignedTo" validate:"omitempty,objectid"`
	DueDate     *string `json:"dueDate" validate:"omitempty,date"`
	StartDate   *string `json:"startDate" validate:"omitempty,date"`
}

// UpdateTaskRequest represents task update request
type UpdateTaskRequest struct {
	Title       *string `json:"title" validate:"omitempty,min=1,max=200"`
	Description *string `json:"description" validate:"omitempty,max=2000"`
	Priority    *string `json:"priority" validate:"omitempty,oneof=LOW NORMAL HIGH CRITICAL"`
	CategoryID  *string `json:"categoryId" validate:"omitempty"`
	DueDate     *string `json:"dueDate" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	StartDate   *string `json:"startDate" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
}

// UpdateTaskStatusRequest represents task status update request
type UpdateTaskStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=TODO IN_PROGRESS REVIEW COMPLETED ARCHIVED"`
}

// UpdateTaskPositionRequest represents task position update request
type UpdateTaskPositionRequest struct {
	Position int    `json:"position" validate:"min=0"`
	Status   string `json:"status" validate:"required,oneof=TODO IN_PROGRESS REVIEW COMPLETED"`
}

// AssignTaskRequest represents task assignment request
type AssignTaskRequest struct {
	AssignedTo string `json:"assignedTo" validate:"required,objectid"`
}

// TaskResponse represents task data in API responses
type TaskResponse struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	Status      string  `json:"status"`
	Priority    string  `json:"priority"`
	Position    int     `json:"position"`

	// References with populated data
	Board        *BoardSummaryResponse `json:"board"`
	Category     *CategoryResponse     `json:"category,omitempty"`
	AssignedTo   *UserMinimal          `json:"assignedTo,omitempty"`
	CreatedBy    *UserMinimal          `json:"createdBy"`
	LastEditedBy *UserMinimal          `json:"lastEditedBy"`

	// Dates
	DueDate     *string `json:"dueDate,omitempty"`
	StartDate   *string `json:"startDate,omitempty"`
	CompletedAt *string `json:"completedAt,omitempty"`
	ArchivedAt  *string `json:"archivedAt,omitempty"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`

	// Computed flags
	IsOverdue bool `json:"isOverdue"`
	CanEdit   bool `json:"canEdit"`

	// Counters
	CommentCount int `json:"commentCount"`
}

type BoardSummaryResponse struct {
	ID    string  `json:"id"`
	Title string  `json:"title"`
	Color *string `json:"color,omitempty"`
}

type TaskKanbanResponse struct {
	Todo       []*TaskResponse `json:"todo"`
	InProgress []*TaskResponse `json:"inProgress"`
	Review     []*TaskResponse `json:"review"`
	Completed  []*TaskResponse `json:"completed"`
}
