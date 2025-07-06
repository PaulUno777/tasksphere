package utils

import (
	"errors"
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

var validate *validator.Validate

func init() {
	validate = validator.New()

	// Register custom validators
	validate.RegisterValidation("password", validatePassword)
	validate.RegisterValidation("objectid", validateObjectIDHex)
	validate.RegisterValidation("date", validateAnyDateFormat)

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
		return fmt.Errorf("invalid request body %v", err)
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
	case "objectid":
		return i18n.T(lang, "validation.objectid", template)
	case "date":
		return i18n.T(lang, "validation.date", template)
	case "hexcolor":
		return i18n.T(lang, "validation.hexcolor", template)
	case "url":
		return i18n.T(lang, "validation.url", template)
	case "dive":
		return i18n.T(lang, "validation.dive", template)
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

// Validate ObjectId Hex string
func validateObjectIDHex(fl validator.FieldLevel) bool {
	hexStr := fl.Field().String()
	_, err := bson.ObjectIDFromHex(hexStr)
	return err == nil
}

func validateAnyDateFormat(fl validator.FieldLevel) bool {
	dateStr := fl.Field().String()

	// List of common date/time layouts to try.
	// You can expand this list based on the formats you expect.
	layouts := []string{
		time.RFC3339,          // "2006-01-02T15:04:05Z07:00"
		time.RFC3339Nano,      // "2006-01-02T15:04:05.999999999Z07:00"
		time.RFC1123Z,         // "Mon, 02 Jan 2006 15:04:05 -0700"
		time.RFC1123,          // "Mon, 02 Jan 2006 15:04:05 MST"
		time.ANSIC,            // "Mon Jan _2 15:04:05 2006"
		time.UnixDate,         // "Mon Jan _2 15:04:05 MST 2006"
		time.RubyDate,         // "Mon Jan 02 15:04:05 -0700 2006"
		"2006-01-02",          // YYYY-MM-DD
		"01/02/2006",          // MM/DD/YYYY
		"02-01-2006",          // DD-MM-YYYY
		"2006-01-02 15:04:05", // YYYY-MM-DD HH:MM:SS
		"2006-01-02T15:04:05", // YYYY-MM-DDTHH:MM:SS (without timezone)
		"Jan _2 2006",         // Mon _D YYYY
		"January _2, 2006",    // Month D, YYYY
	}

	for _, layout := range layouts {
		_, err := time.Parse(layout, dateStr)
		if err == nil {
			return true // Successfully parsed with at least one layout
		}
	}
	return false // Failed to parse with any of the defined layouts
}
