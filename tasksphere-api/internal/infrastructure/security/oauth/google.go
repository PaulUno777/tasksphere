package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// GoogleService implements OAuth service for Google
type GoogleService struct {
	config *oauth2.Config
}

// NewGoogleService creates a new Google OAuth service
func NewGoogleService(cfg *config.GoogleOAuthConfig) *GoogleService {
	return &GoogleService{
		config: &oauth2.Config{
			ClientID:     cfg.ClientID,
			ClientSecret: cfg.ClientSecret,
			RedirectURL:  cfg.RedirectURL,
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		},
	}
}

// GetGoogleAuthURL generates Google OAuth URL
func (g *GoogleService) GetGoogleAuthURL(state string) string {
	return g.config.AuthCodeURL(state)
}

// ExchangeGoogleCode exchanges OAuth code for user info
func (g *GoogleService) ExchangeGoogleCode(ctx context.Context, code string) (*services.GoogleUserInfo, error) {
	// Exchange code for token
	token, err := g.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	// Get user info from Google API
	client := g.config.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: status %d", resp.StatusCode)
	}

	var userInfo services.GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &userInfo, nil
}
