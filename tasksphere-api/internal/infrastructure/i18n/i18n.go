package i18n

import (
	"embed"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/gofiber/fiber/v2/log"
	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

//go:embed locales/*.json
var localeFS embed.FS

// I18nService handles internationalization
type I18nService struct {
	bundle      *i18n.Bundle
	DefaultLang string
	cfg         *config.I18nConfig
}

var (
	instance *I18nService
	once     sync.Once
)

// NewService creates a new i18n manager
func Load() (services.I18nService, error) {

	once.Do(func() {
		cfg := config.Get().I18n
		bundle := i18n.NewBundle(language.English)
		bundle.RegisterUnmarshalFunc("json", json.Unmarshal)

		//Load locale files
		for _, lang := range cfg.SupportedLangs {
			filename := fmt.Sprintf("locales/%s.json", lang)
			_, err := bundle.LoadMessageFileFS(localeFS, filename)
			if err != nil {
				log.Errorf("failed to load locale %s: %w", lang, err)
			}
		}

		instance = &I18nService{
			bundle:      bundle,
			DefaultLang: cfg.DefaultLanguage,
		}
	})
	return instance, nil
}

func Get() *I18nService {
	if instance == nil {
		Load()
	}
	return instance
}

// GetLocalizer creates a localizer for the given language
func (s *I18nService) GetLocalizer(lang string) *i18n.Localizer {
	return i18n.NewLocalizer(s.bundle, lang)
}

// T translates a message
func (s *I18nService) T(lang, key string, templateData ...map[string]interface{}) string {
	localizer := s.GetLocalizer(lang)

	config := &i18n.LocalizeConfig{
		MessageID: key,
	}

	if len(templateData) > 0 {
		config.TemplateData = templateData[0]
	}

	message, err := localizer.Localize(config)
	if err != nil {
		return key // Fallback to message ID
	}

	return message
}
