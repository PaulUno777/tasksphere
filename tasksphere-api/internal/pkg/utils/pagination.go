package utils

import (
	"math"

	"github.com/gofiber/fiber/v2"
)

const (
	DefaultPageSize  = 20
	MaxPageSize      = 100
	DefaultSortBy    = "createdAt"
	DefaultSortOrder = "desc"
)

type BaseFilter struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	SortBy    string `json:"Sort_by"`
	SortOrder string `json:"Sort_order"`
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
	List     []T          `json:"list"`
	Metadata PageMetadata `json:"metadata"`
}

func (f *BaseFilter) WithDefaults() *BaseFilter {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = DefaultPageSize
	}
	if f.Limit > MaxPageSize {
		f.Limit = MaxPageSize
	}
	if f.SortBy == "" {
		f.SortBy = DefaultSortBy
	}
	if f.SortOrder != "asc" && f.SortOrder != "desc" {
		f.SortOrder = DefaultSortOrder
	}
	return f
}

func ParseFilterFromFiber[T any](c *fiber.Ctx) (*T, error) {
	var filter T
	if err := c.QueryParser(&filter); err != nil {
		return nil, err
	}

	// Apply pagination defaults if T embeds BaseFilter
	if f, ok := any(&filter).(interface{ WithDefaults() *BaseFilter }); ok {
		f.WithDefaults()
	}

	return &filter, nil
}

func (f *BaseFilter) ToMetadata(totalItems int64) PageMetadata {
	totalPages := int(math.Ceil(float64(totalItems) / float64(f.Limit)))

	return PageMetadata{
		Page:       f.Page,
		Limit:      f.Limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
		HasNext:    f.Page < totalPages,
		HasPrev:    f.Page > 1,
	}
}

// NewPage wraps data and metadata together
func NewPage[T any](items []T, req *BaseFilter, total int64) *Page[T] {
	return &Page[T]{
		List:     items,
		Metadata: req.ToMetadata(total),
	}
}
