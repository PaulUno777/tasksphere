package validator

import (
	"errors"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate *validator.Validate

func init() {
	validate = validator.New()

	// Register custom validators
	validate.RegisterValidation("password", validatePassword)
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(s interface{}) error {
	if err := validate.Struct(s); err != nil {
		return formatValidationErrors(err)
	}
	return nil
}

// ParseAndValidate parses request body and validates it
func ParseAndValidate(c *fiber.Ctx, dest interface{}) error {
	if err := c.BodyParser(dest); err != nil {
		return errors.New("invalid request body")
	}

	return ValidateStruct(dest)
}

// formatValidationErrors formats validation errors into readable messages
func formatValidationErrors(err error) error {
	var messages []string

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			field := getJSONFieldName(e)
			message := getValidationMessage(field, e)
			messages = append(messages, message)
		}
	}

	return errors.New(strings.Join(messages, ", "))
}

// getJSONFieldName gets the JSON field name from validation error
func getJSONFieldName(e validator.FieldError) string {
	field := e.Field()

	// Try to get JSON tag name
	if e.StructNamespace() != "" {
		parts := strings.Split(e.StructNamespace(), ".")
		if len(parts) > 1 {
			structType := reflect.TypeOf(e.Value())
			if structType != nil && structType.Kind() == reflect.Struct {
				if fieldStruct, found := structType.FieldByName(field); found {
					if jsonTag := fieldStruct.Tag.Get("json"); jsonTag != "" {
						jsonName := strings.Split(jsonTag, ",")[0]
						if jsonName != "-" {
							return jsonName
						}
					}
				}
			}
		}
	}

	return strings.ToLower(field)
}

// getValidationMessage returns a user-friendly validation message
func getValidationMessage(field string, e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return field + " is required"
	case "email":
		return field + " must be a valid email address"
	case "min":
		return field + " must be at least " + e.Param() + " characters long"
	case "max":
		return field + " must be at most " + e.Param() + " characters long"
	case "password":
		return field + " must contain at least 8 characters with uppercase, lowercase, number and special character"
	case "oneof":
		return field + " must be one of: " + e.Param()
	default:
		return field + " is invalid"
	}
}

// Custom password validator
func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	if len(password) < 8 {
		return false
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case char >= 32 && char <= 126:
			if !((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
				hasSpecial = true
			}
		}
	}

	return hasUpper && hasLower && hasNumber && hasSpecial
}
