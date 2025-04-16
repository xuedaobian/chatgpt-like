/**
 * Represents a chat session.
 */
export interface Chat {
  id: string;
  user_id?: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  title_generated_by?: 'initial' | 'ai' | 'user';
  message_count_for_ai_title?: number;
}

/**
 * Represents a single message within a chat.
 */
export interface Message {
  id: string;
  chat_id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

/**
 * For compatibility with existing ChatMessage type
 */
export function mapMessageToChatMessage(message: Message): import('../types/chat').ChatMessage {
  return {
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.content
  };
}

/**
 * For converting from ChatMessage to database Message
 */
export function mapChatMessageToSender(role: string): 'user' | 'bot' {
  return role === 'user' ? 'user' : 'bot';
}
