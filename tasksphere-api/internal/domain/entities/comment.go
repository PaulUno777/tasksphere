package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Comment struct {
	*Base `bson:",inline"`

	Content  string        `bson:"content" json:"content"`
	AuthorID bson.ObjectID `bson:"authorId" json:"authorId"`
	TaskID   bson.ObjectID `bson:"taskId" json:"taskId"`
	Type     CommentType   `bson:"type"`

	// Mentions
	Mentions  []bson.ObjectID   `bson:"mentions,omitempty"`
	Reactions []CommentReaction `bson:"reactions,omitempty"` // Reactions to comment

	// Features
	IsEdited     bool       `bson:"isEdited"`
	LastEditedAt *time.Time `bson:"lastEditedAt,omitempty"`
}

type CommentReaction struct {
	UserID  bson.ObjectID `bson:"userId"`
	Emoji   string        `bson:"emoji"` // Emoji unicode or shortcode
	AddedAt time.Time     `bson:"addedAt"`
}

func (c *Comment) CanBeEdited() bool {
	return  c.Type == CommentTypeRegular
}

func (c *Comment) Edit(content string, userID bson.ObjectID) {
	if c.AuthorID == userID && c.CanBeEdited() {
		c.Content = content
		c.IsEdited = true
		c.UpdateTimestamp()
	}
}

func (c *Comment) AddReaction(userID bson.ObjectID, emoji string) {
	// Remove existing reaction from same user with same emoji
	c.RemoveReaction(userID, emoji)
	
	// Add new reaction
	reaction := CommentReaction{
		UserID:  userID,
		Emoji:   emoji,
		AddedAt: time.Now(),
	}
	c.Reactions = append(c.Reactions, reaction)
	c.UpdateTimestamp()
}

func (c *Comment) RemoveReaction(userID bson.ObjectID, emoji string) {
	for i, reaction := range c.Reactions {
		if reaction.UserID == userID && reaction.Emoji == emoji {
			// Remove reaction by slicing
			c.Reactions = append(c.Reactions[:i], c.Reactions[i+1:]...)
			c.UpdateTimestamp()
			break
		}
	}
}

func (c *Comment) GetReactionCount(emoji string) int {
	count := 0
	for _, reaction := range c.Reactions {
		if reaction.Emoji == emoji {
			count++
		}
	}
	return count
}

func (c *Comment) HasUserReacted(userID bson.ObjectID, emoji string) bool {
	for _, reaction := range c.Reactions {
		if reaction.UserID == userID && reaction.Emoji == emoji {
			return true
		}
	}
	return false
}

func (c *Comment) AddMention(userID bson.ObjectID) {
	// Check if user is already mentioned
	for _, mentionedUserID := range c.Mentions {
		if mentionedUserID == userID {
			return // Already mentioned
		}
	}
	c.Mentions = append(c.Mentions, userID)
	c.UpdateTimestamp()
}

func (c *Comment) RemoveMention(userID bson.ObjectID) {
	for i, mentionedUserID := range c.Mentions {
		if mentionedUserID == userID {
			c.Mentions = append(c.Mentions[:i], c.Mentions[i+1:]...)
			c.UpdateTimestamp()
			break
		}
	}
}

func (c *Comment) SetMentions(mentions []bson.ObjectID) {
	c.Mentions = mentions
	c.UpdateTimestamp()
}
