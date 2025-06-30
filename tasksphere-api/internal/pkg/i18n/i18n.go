package i18n

import (
	"encoding/json"
	"fmt"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

// Manager handles internationalization
type Manager struct {
	bundle *i18n.Bundle
}

// New creates a new i18n manager
func New() *Manager {

	bundle := i18n.NewBundle(language.English)
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)

	return &Manager{
		bundle: bundle,
	}
}

// LoadLocales loads locale files
func (m *Manager) LoadLocales() error {
	fmt.Println("i18n manager loaded with supported languages: [en, fr]")

	locales := []string{"en", "fr"}

	for _, locale := range locales {
		filename := fmt.Sprintf("internal/pkg/i18n/locales/%s.json", locale)
		if _, err := m.bundle.LoadMessageFile(filename); err != nil {
			return fmt.Errorf("failed to load locale %s: %w", locale, err)
		}
	}

	return nil
}

// Translate translates a message
func (m *Manager) Translate(lang, messageID string, templateData ...map[string]interface{}) string {
	localizer := i18n.NewLocalizer(m.bundle, lang)

	config := &i18n.LocalizeConfig{
		MessageID: messageID,
	}

	if len(templateData) > 0 {
		config.TemplateData = templateData[0]
	}

	message, err := localizer.Localize(config)
	if err != nil {
		return messageID // Fallback to message ID
	}

	return message
}
