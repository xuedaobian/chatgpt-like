import { ChatMessage } from '../types/chat';

const chatHistories = new Map<string, ChatMessage[]>();

export const getHistory = (sessionId: string): ChatMessage[] | undefined => {
  return chatHistories.get(sessionId);
};

export const createHistory = (sessionId: string): ChatMessage[] => {
  const history: ChatMessage[] = [];
  chatHistories.set(sessionId, history);
  return history;
};

export const addMessage = (sessionId: string, message: ChatMessage): void => {
  const history = chatHistories.get(sessionId);
  if (history) {
    history.push(message);
  } else {
    console.warn(`Attempted to add message to non-existent session: ${sessionId}`);
    // Optionally create session here if desired
    // const newHistory = createHistory(sessionId);
    // newHistory.push(message);
  }
};

export const removeLastAssistantMessage = (sessionId: string): boolean => {
  const history = chatHistories.get(sessionId);
  if (history && history.length > 0 && history[history.length - 1].role === 'assistant') {
    history.pop();
    return true;
  }
  return false;
};

export const getLastMessage = (sessionId: string): ChatMessage | undefined => {
  const history = chatHistories.get(sessionId);
  return history && history.length > 0 ? history[history.length - 1] : undefined;
};

export const hasHistory = (sessionId: string): boolean => {
  return chatHistories.has(sessionId);
};

export const getAllSessionIds = (): string[] => {
  return Array.from(chatHistories.keys());
};
