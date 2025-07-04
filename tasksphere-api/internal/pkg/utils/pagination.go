package utils

import (
	"math"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

const (
	DefaultPageSize = 20
	MaxPageSize     = 100
	DefaultSortBy   = "createdAt"
	DefaultSortDir  = "desc"
)

type PaginationParams struct {
	Page    int    `json:"page" validate:"min=1"`
	Limit   int    `json:"limit" validate:"min=1,max=100"`
	SortBy  string `json:"sort_by"`
	SortDir string `json:"sort_dir" validate:"oneof=asc desc"`
}

// PageMetadata represents paginated response metadata
type PageMetadata struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalItems int64 `json:"totalItems"`
	TotalPages int   `json:"totalPages"`
	HasNext    bool  `json:"hasNext"`
	HasPrev    bool  `json:"hasPrev"`
}

// Page represents a paginated response with data
type Page[T any] struct {
	Data     []T          `json:"data"`
	Metadata PageMetadata `json:"metadata"`
}

// ParseFromFiber parses pagination from query parameters
func ParseFromFiber(c *fiber.Ctx) *PaginationParams {
	page := parseInt(c.Query("page"), 1)
	pageSize := parseInt(c.Query("limit"), DefaultPageSize)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}

	sortBy := c.Query("sort_by", DefaultSortBy)
	sortDir := c.Query("sort_dir", DefaultSortDir)

	if sortDir != "asc" && sortDir != "desc" {
		sortDir = DefaultSortDir
	}

	return &PaginationParams{
		Page:    page,
		Limit:   pageSize,
		SortBy:  sortBy,
		SortDir: sortDir,
	}
}

func (p *PaginationParams) GetLimit() int {
	return p.Limit
}

func (p *PaginationParams) ToMetadata(totalItems int64) PageMetadata {
	totalPages := int(math.Ceil(float64(totalItems) / float64(p.Limit)))

	return PageMetadata{
		Page:       p.Page,
		Limit:      p.Limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
		HasNext:    p.Page < totalPages,
		HasPrev:    p.Page > 1,
	}
}

// NewPage wraps data and metadata together
func NewPage[T any](items []T, req *PaginationParams, total int64) *Page[T] {
	return &Page[T]{
		Data:     items,
		Metadata: req.ToMetadata(total),
	}
}

// parseInt converts string to int, fallback on failure
func parseInt(str string, fallback int) int {
	n, err := strconv.Atoi(str)
	if err != nil {
		return fallback
	}
	return n
}
