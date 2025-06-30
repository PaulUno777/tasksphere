package config

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
}

// Validate validates the configuration struct
func (c *Config) Validate() error {
	if err := validate.Struct(c); err != nil {
		return formatValidationError(err)
	}

	// Custom validation for JWT secrets in production
	if c.Server.Environment == "production" {
		if c.JWT.Secret == "" || len(c.JWT.Secret) < 32 {
			return fmt.Errorf("JWT_SECRET must be at least 32 characters in production")
		}
		if c.JWT.RefreshSecret == "" || len(c.JWT.RefreshSecret) < 32 {
			return fmt.Errorf("JWT_REFRESH_SECRET must be at least 32 characters in production")
		}
	}

	return nil
}

// formatValidationError formats validation errors into a readable string
func formatValidationError(err error) error {
	var messages []string

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			field := e.Field()
			tag := e.Tag()
			param := e.Param()

			var message string
			switch tag {
			case "required":
				message = fmt.Sprintf("%s is required", field)
			case "oneof":
				message = fmt.Sprintf("%s must be one of: %s", field, param)
			case "min":
				message = fmt.Sprintf("%s must be at least %s", field, param)
			case "max":
				message = fmt.Sprintf("%s must be at most %s", field, param)
			default:
				message = fmt.Sprintf("%s failed validation for tag '%s'", field, tag)
			}

			messages = append(messages, message)
		}
	}

	return fmt.Errorf("configuration validation failed: %s", strings.Join(messages, ", "))
}
