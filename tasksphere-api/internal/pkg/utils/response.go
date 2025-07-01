package utils

import "github.com/gofiber/fiber/v2"

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// Meta represents pagination and additional metadata
type Meta struct {
	Page       int   `json:"page,omitempty"`
	Limit      int   `json:"limit,omitempty"`
	Total      int64 `json:"total,omitempty"`
	TotalPages int   `json:"total_pages,omitempty"`
}

// SuccessResponse returns a successful response
func SuccessResponse(c *fiber.Ctx, data interface{}, message string) error {
	return c.JSON(Response{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// SuccessResponseWithMeta returns a successful response with metadata
func SuccessResponseWithMeta(c *fiber.Ctx, data interface{}, meta *Meta, message string) error {
	return c.JSON(Response{
		Success: true,
		Data:    data,
		Message: message,
		Meta:    meta,
	})
}

// CreatedResponse returns a 201 created response
func CreatedResponse(c *fiber.Ctx, data interface{}, message string) error {
	return c.Status(fiber.StatusCreated).JSON(Response{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// NoContentResponse returns a 204 no content response
func NoContentResponse(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}
