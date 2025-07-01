package middleware

import (
	"strings"

	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func AuthMiddleware(authService services.AuthService, localizer services.I18nService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		lang := c.Get("Accept-Language", "en")

		// Get authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return errors.NewUnauthorizedError(
				localizer.T(lang, "errors.invalid_token"))
		}

		// Check Bearer token format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return errors.NewUnauthorizedError(
				localizer.T(lang, "errors.invalid_token"))
		}

		token := parts[1]

		// Validate token
		claims, err := authService.ValidateAccessToken(token)
		if err != nil {
			return errors.NewUnauthorizedError(
				localizer.T(lang, "errors.invalid_token"))
		}

		// Set user ID in context
		c.Locals("userID", claims.UserID)
		c.Locals("userEmail", claims.Email)
		if claims.Language != "" {
			c.Locals(i18n.LangContextKey, claims.Language)
		}

		return c.Next()
	}
}

func GetInfoFromContext(c *fiber.Ctx) (userID, email, language string) {
	if uid := c.Locals("userID"); uid != nil {
		userID = uid.(string)
	}
	if e := c.Locals("userEmail"); e != nil {
		email = e.(string)
	}
	if l := c.Locals(i18n.LangContextKey); l != nil {
		language = l.(string)
	}
	if language == "" {
		language = "en"
	}
	return
}

func GetLangFromContext(c *fiber.Ctx) (lang string) {
	if uid := c.Locals(i18n.LangContextKey); uid != nil {
		lang = uid.(string)
	}
	return
}

func GetUserIDFromContext(c *fiber.Ctx) (userID bson.ObjectID) {
	if uid := c.Locals("userID"); uid != nil {
		userID = uid.(bson.ObjectID)
	}
	return
}
