package services

type I18nService interface {
	T(lang string, key string, templateData ...map[string]interface{}) string
}
