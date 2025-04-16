export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  sessionId?: string;
  newMessageContent: string;
}

export interface RetryRequest {
  sessionId: string;
}

export interface HistoryRequestParams {
  sessionId: string;
}

export interface SessionEvent {
  sessionId: string;
}

export interface MessageEvent {
  content: string;
}

export interface ErrorEvent {
  error: string;
  details?: string;
}
