package utils

import (
	"errors"
	"reflect"
	"strings"

	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
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
func ValidateStruct(s interface{}, lang string) error {
	if err := validate.Struct(s); err != nil {
		return formatValidationErrors(err, lang)
	}
	return nil
}

// ParseAndValidate parses request body and validates it
func ParseAndValidate(c *fiber.Ctx, dest interface{}, lang string) error {
	if err := c.BodyParser(dest); err != nil {
		return errors.New("invalid request body")
	}

	return ValidateStruct(dest, lang)
}

// formatValidationErrors formats validation errors into readable messages
func formatValidationErrors(err error, lang string) error {
	var messages []string

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			field := getJSONFieldName(e)
			message := getValidationMessage(field, e, lang)
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
func getValidationMessage(field string, e validator.FieldError, lang string) string {
	i18n := i18n.Get()

	template := map[string]interface{}{
		"Field": field,
		"Param": e.Param(),
	}

	switch e.Tag() {
	case "required":
		return i18n.T(lang, "validation.required", template)
	case "email":
		return i18n.T(lang, "validation.email", template)
	case "min":
		return i18n.T(lang, "validation.min", template)
	case "max":
		return i18n.T(lang, "validation.max", template)
	case "password":
		return i18n.T(lang, "validation.password", template)
	case "oneof":
		return i18n.T(lang, "validation.oneof", template)
	default:
		return i18n.T(lang, "validation.invalid", template)
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
