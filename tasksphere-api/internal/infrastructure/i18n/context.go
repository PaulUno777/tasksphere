package i18n

import (
	"context"
)

type ContextKey string

const (
	LangContextKey ContextKey = "lang"
)

// SetToContext sets the selected language into the context
func (m *I18nService) SetLang(ctx context.Context, lang string) context.Context {
	if lang == "" {
		lang = m.DefaultLang
	}
	return context.WithValue(ctx, LangContextKey, lang)
}

// GetFromContext retrieves the language from context, fallback to default
func (m *I18nService) GetLang(ctx context.Context) string {
	lang, ok := ctx.Value(LangContextKey).(string)
	if !ok || lang == "" {
		return m.DefaultLang
	}
	return lang
}
