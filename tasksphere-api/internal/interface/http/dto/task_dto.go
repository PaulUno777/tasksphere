package dto

// CreateTaskRequest represents task creation request
type CreateTaskRequest struct {
	Title        string `json:"title" validate:"required,min=3,max=200"`
	Description  string `json:"description" validate:"omitempty,max=2000"`
	Priority     string `json:"priority" validate:"required,oneof=LOW MEDIUM HIGH"`
	DueDate      string `json:"dueDate" validate:"omitempty,date"`
	AssignedToID string `json:"assignedToId" validate:"omitempty,objectid"`
	CategoryID   string `json:"categoryId" validate:"omitempty,objectid"`
}

// UpdateTaskRequest represents task update request
type UpdateTaskRequest struct {
	Title        string `json:"title" validate:"omitempty,min=3,max=200"`
	Description  string `json:"description" validate:"omitempty,max=2000"`
	Priority     string `json:"priority" validate:"omitempty,oneof=LOW MEDIUM HIGH"`
	DueDate      string `json:"dueDate" validate:"omitempty,date"`
	AssignedToID string `json:"assignedToId" validate:"omitempty,objectid"`
	CategoryID   string `json:"categoryId" validate:"omitempty,objectid"`
}

// UpdateTaskStatusRequest represents task status update request
type UpdateTaskStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=TODO IN_PROGRESS REVIEW COMPLETED ARCHIVED"`
}

// AssignTaskRequest represents task assignment request
type AssignTaskRequest struct {
	AssignedToID string `json:"assignedToId" validate:"required,objectid"`
}

// TaskResponse represents task data in API responses
type TaskResponse struct {
	ID            string            `json:"id"`
	Title         string            `json:"title"`
	Description   string            `json:"description"`
	Status        string            `json:"status"`
	Priority      string            `json:"priority"`
	DueDate       string            `json:"dueDate,omitempty"`
	IsOverdue     bool              `json:"isOverdue"`
	AssignedTo    *UserResponse     `json:"assignedTo,omitempty"`
	Category      *CategoryResponse `json:"category,omitempty"`
	LastUpdatedBy *UserResponse     `json:"lastUpdatedBy,omitempty"`
	CreatedAt     string            `json:"createdAt"`
	UpdatedAt     string            `json:"updatedAt"`
}

// TaskFilter represents task filtering options for API
type TaskFilterRequest struct {
	AssignedToID string `query:"assignedToId" validate:"omitempty,objectid"`
	Status       string `query:"status" validate:"omitempty,oneof=TODO IN_PROGRESS REVIEW COMPLETED ARCHIVED"`
	Priority     string `query:"priority" validate:"omitempty,oneof=LOW MEDIUM HIGH"`
	CategoryID   string `query:"categoryId" validate:"omitempty,objectid"`
	Search       string `query:"search"`
	DueBefore    string `query:"dueBefore" validate:"omitempty,date"`
	DueAfter     string `query:"dueAfter" validate:"omitempty,date"`
}
