package middleware

import (
	"strings"

	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/gofiber/fiber/v2"
)

func I18nMiddleware(defaultLang string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		lang := c.Get("Accept-Language", defaultLang)

		// Optionally simplify "fr-FR" → "fr"
		if idx := strings.Index(lang, "-"); idx != -1 {
			lang = lang[:idx]
		}

		c.Locals(i18n.LangContextKey, lang)
		return c.Next()
	}
}
