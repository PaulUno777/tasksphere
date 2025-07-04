package email

import (
	"bytes"
	"context"
	"fmt"
	"text/template"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
)

// EmailFormatter implements MessageFormatter for email notifications
type EmailFormatter struct {
	templates map[entities.NotificationType]*template.Template
}

// NewEmailFormatter creates a new email formatter
func NewEmailFormatter() *EmailFormatter {
	formatter := &EmailFormatter{
		templates: make(map[entities.NotificationType]*template.Template),
	}

	formatter.loadTemplates()
	return formatter
}

// GetChannel returns the email channel
func (f *EmailFormatter) GetChannel() entities.NotificationChannel {
	return entities.ChannelEmail
}

// GetSupportedTypes returns supported notification types
func (f *EmailFormatter) GetSupportedTypes() []entities.NotificationType {
	return []entities.NotificationType{
		entities.NotificationTypeEmailVerification,
		entities.NotificationTypeBoardInvite,
		entities.NotificationTypeBoardWelcome,
	}
}

// Format formats a notification message for email
func (f *EmailFormatter) Format(ctx context.Context, message *entities.NotificationMessage) (*services.FormattedMessage, error) {
	template, exists := f.templates[message.Type]
	if !exists {
		return nil, fmt.Errorf("no template found for notification type: %s", message.Type)
	}

	var content bytes.Buffer
	if err := template.Execute(&content, message.Data); err != nil {
		return nil, fmt.Errorf("failed to execute template: %w", err)
	}

	return &services.FormattedMessage{
		Subject:     message.Subject,
		Content:     content.String(),
		ContentType: "text/html",
		Metadata: map[string]interface{}{
			"recipientEmail": message.RecipientEmail,
			"recipientName":  message.RecipientName,
		},
	}, nil
}

// loadTemplates loads email templates
func (f *EmailFormatter) loadTemplates() {
	// Email verification template
	f.templates[entities.NotificationTypeEmailVerification] = template.Must(template.New("email_verification").Parse(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TaskSphere</h1>
        <p>Email Verification</p>
    </div>
    <div class="content">
        <h2>Hi {{.userName}}!</h2>
        <p>Welcome to TaskSphere! Please verify your email address to complete your account setup.</p>
        <p>Click the button below to verify your email address:</p>
        <a href="{{.verificationURL}}" class="button">Verify Email Address</a>
        <p>This link will expire in 30 minutes for security reasons.</p>
        <p>If you didn't create an account with TaskSphere, you can safely ignore this email.</p>
    </div>
    <div class="footer">
        <p>© 2024 TaskSphere. All rights reserved.</p>
    </div>
</body>
</html>
	`))

	// Board invitation template
	f.templates[entities.NotificationTypeBoardInvite] = template.Must(template.New("board_invite").Parse(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Board Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .board-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TaskSphere</h1>
        <p>Board Invitation</p>
    </div>
    <div class="content">
        <h2>You're invited to collaborate!</h2>
        <p><strong>{{.inviterName}}</strong> ({{.inviterEmail}}) has invited you to join a board on TaskSphere.</p>
        
        <div class="board-info">
            <h3>{{.boardTitle}}</h3>
            {{if .boardDesc}}<p>{{.boardDesc}}</p>{{end}}
            <p><strong>Your role:</strong> {{.role}}</p>
        </div>
        
        <p>Click the button below to accept the invitation:</p>
        <a href="{{.inviteURL}}" class="button">Accept Invitation</a>
        
        <p><strong>Important:</strong> This invitation expires on {{.expiresAt}}.</p>
        
        <p>If you don't want to join this board, you can safely ignore this email.</p>
    </div>
    <div class="footer">
        <p>© 2024 TaskSphere. All rights reserved.</p>
    </div>
</body>
</html>
	`))

	// Board welcome template
	f.templates[entities.NotificationTypeBoardWelcome] = template.Must(template.New("board_welcome").Parse(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Board</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7C3AED; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .board-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7C3AED; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TaskSphere</h1>
        <p>Welcome to the Team!</p>
    </div>
    <div class="content">
        <h2>Hi {{.userName}}!</h2>
        <p>Welcome to the board! You're now a member and can start collaborating with your team.</p>
        
        <div class="board-info">
            <h3>{{.boardTitle}}</h3>
            {{if .boardDesc}}<p>{{.boardDesc}}</p>{{end}}
            <p><strong>Your role:</strong> {{.role}}</p>
        </div>
        
        <p>Click the button below to get started:</p>
        <a href="{{.boardURL}}" class="button">Go to Board</a>
        
        <p>You can now create tasks, collaborate with team members, and track project progress.</p>
    </div>
    <div class="footer">
        <p>© 2024 TaskSphere. All rights reserved.</p>
    </div>
</body>
</html>
	`))
}
