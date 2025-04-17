import { ChatMessage } from '../types/chat';
// import { query } from '../db'; // 暂时不用数据库
import { Chat, Message, mapMessageToChatMessage, mapChatMessageToSender } from '../types/database.type';

// --- In-memory storage ---
const inMemoryChats: { [id: string]: Chat } = {};
const inMemoryMessages: { [chatId: string]: ChatMessage[] } = {};

/**
 * 创建一个新的聊天会话。
 */
export const createChat = async (title: string = 'New Chat', userId: string = 'anonymous'): Promise<string> => {
  const id = Math.random().toString(36).slice(2, 18);
  inMemoryChats[id] = {
    id,
    user_id: userId,
    title,
    created_at: new Date(),
    updated_at: new Date(),
  };
  inMemoryMessages[id] = [];
  return id;
};

/**
 * 检查给定会话 ID 是否存在聊天记录。
 */
export const hasHistory = async (sessionId: string): Promise<boolean> => {
  return !!inMemoryMessages[sessionId] && inMemoryMessages[sessionId].length > 0;
};

/**
 * 检索给定会话 ID 的聊天记录，按创建时间排序。
 */
export const getHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  return inMemoryMessages[sessionId] ? [...inMemoryMessages[sessionId]] : [];
};

/**
 * 向给定会话 ID 的聊天记录中添加新消息。
 */
export const addMessage = async (sessionId: string, message: ChatMessage, userId: string = 'anonymous'): Promise<void> => {
  if (!inMemoryChats[sessionId]) {
    // Create chat if it doesn't exist
    inMemoryChats[sessionId] = {
      id: sessionId,
      user_id: userId,
      title: 'New Chat',
      created_at: new Date(),
      updated_at: new Date(),
    };
    inMemoryMessages[sessionId] = [];
  }
  inMemoryMessages[sessionId].push(message);
  inMemoryChats[sessionId].updated_at = new Date();
};

/**
 * 检索给定会话 ID 的聊天记录中最后添加的消息。
 */
export const getLastMessage = async (sessionId: string): Promise<ChatMessage | null> => {
  const msgs = inMemoryMessages[sessionId];
  return msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
};

/**
 * 如果最后一条消息来自助手，则移除该消息。
 * 如果移除了消息，则返回 true，否则返回 false。
 */
export const removeLastAssistantMessage = async (sessionId: string): Promise<boolean> => {
  const msgs = inMemoryMessages[sessionId];
  if (!msgs || msgs.length === 0) return false;
  const last = msgs[msgs.length - 1];
  if (last.role !== 'assistant') return false;
  msgs.pop();
  return true;
};

/**
 * 检索历史记录中所有的会话列表。
 */
export const getAllSessionIds = async (): Promise<Chat[]> => {
  return Object.values(inMemoryChats);
};

/**
 * 创建历史记录
 */
export const createHistory = (sessionId: string): ChatMessage[] => {
  return [];
};

/**
 * 更新聊天标题
 */
export const updateChatTitle = async (chatId: string, title: string, source: 'user' | 'ai' = 'user'): Promise<void> => {
  if (inMemoryChats[chatId]) {
    inMemoryChats[chatId].title = title;
    inMemoryChats[chatId].updated_at = new Date();
  }
};
