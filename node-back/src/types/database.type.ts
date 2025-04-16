/**
 * Represents a conversation session.
 */
export interface Conversation {
  id: number;
  title: string;
  created_at: Date;
}

/**
 * Represents a single message within a conversation.
 */
export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}
