export interface CreateCommentRequest {
  content: string;
  mentions?: string[];
}

export interface UpdateCommentRequest {
  content: string;
  mentions?: string[];
}

export interface AddReactionRequest {
  emoji: string;
}
