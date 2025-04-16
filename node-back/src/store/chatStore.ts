import { ChatMessage } from '../types/chat';
import { query } from '../db'; // 导入查询函数
import { Chat, Message, mapMessageToChatMessage, mapChatMessageToSender } from '../types/database.type';

/**
 * 创建一个新的聊天会话。
 */
export const createChat = async (title: string = 'New Chat', userId: string = 'anonymous'): Promise<string> => {
  const result = await query<{ id: string }>(
    'INSERT INTO chats (title, user_id) VALUES ($1, $2) RETURNING id',
    [title, userId]
  );
  return result.rows[0].id;
};

/**
 * 检查给定会话 ID 是否存在聊天记录。
 */
export const hasHistory = async (sessionId: string): Promise<boolean> => {
  const result = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM messages WHERE chat_id = $1)',
    [sessionId]
  );
  return result.rows[0]?.exists ?? false;
};

/**
 * 检索给定会话 ID 的聊天记录，按创建时间排序。
 */
export const getHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const result = await query<Message>(
    'SELECT id, chat_id, sender, content, timestamp FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
    [sessionId]
  );
  // Map database messages to ChatMessage format
  return result.rows.map(mapMessageToChatMessage);
};

/**
 * 向给定会话 ID 的聊天记录中添加新消息。
 */
export const addMessage = async (sessionId: string, message: ChatMessage, userId: string = 'anonymous'): Promise<void> => {
  // Ensure chat exists
  const chatExists = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM chats WHERE id = $1)',
    [sessionId]
  );
  
  if (!chatExists.rows[0].exists) {
    // Create chat if it doesn't exist
    await createChat('New Chat', userId);
  }
  
  // Insert the message
  await query(
    'INSERT INTO messages (chat_id, sender, content) VALUES ($1, $2, $3)',
    [sessionId, mapChatMessageToSender(message.role), message.content]
  );
  
  // Update the chat's updated_at timestamp
  await query(
    'UPDATE chats SET updated_at = CURRENT_TIMESTAMP, message_count_for_ai_title = message_count_for_ai_title + 1 WHERE id = $1',
    [sessionId]
  );
};

/**
 * 检索给定会话 ID 的聊天记录中最后添加的消息。
 */
export const getLastMessage = async (sessionId: string): Promise<ChatMessage | null> => {
  const result = await query<Message>(
    'SELECT sender, content FROM messages WHERE chat_id = $1 ORDER BY timestamp DESC LIMIT 1',
    [sessionId]
  );
  return result.rows[0] ? mapMessageToChatMessage(result.rows[0]) : null;
};

/**
 * 如果最后一条消息来自助手，则移除该消息。
 * 如果移除了消息，则返回 true，否则返回 false。
 */
export const removeLastAssistantMessage = async (sessionId: string): Promise<boolean> => {
  // 查找最后一条消息的 ID
  const lastMsgRes = await query<{ id: number; sender: string }>(
    'SELECT id, sender FROM messages WHERE chat_id = $1 ORDER BY timestamp DESC LIMIT 1',
    [sessionId]
  );

  if (lastMsgRes.rows.length === 0 || lastMsgRes.rows[0].sender !== 'bot') {
    return false; // 没有消息或最后一条消息不是来自助手
  }

  const lastMessageId = lastMsgRes.rows[0].id;

  // 按 ID 删除消息
  const deleteResult = await query(
    'DELETE FROM messages WHERE id = $1',
    [lastMessageId]
  );

  // Update message count
  await query(
    'UPDATE chats SET message_count_for_ai_title = message_count_for_ai_title - 1 WHERE id = $1',
    [sessionId]
  );

  return (deleteResult.rowCount ?? 0) > 0;
};

/**
 * 检索历史记录中所有的会话列表。
 */
export const getAllSessionIds = async (): Promise<Chat[]> => {
  const result = await query<Chat>(
    'SELECT id, user_id, title, created_at, updated_at FROM chats ORDER BY updated_at DESC'
  );
  return result.rows;
};

/**
 * 创建历史记录
 */
export const createHistory = (sessionId: string): ChatMessage[] => {
  // 在数据库上下文中，当添加第一条消息时，历史记录会隐式创建。
  // 实际历史记录通过 getHistory 获取
  return [];
};

/**
 * 更新聊天标题
 */
export const updateChatTitle = async (chatId: string, title: string, source: 'user' | 'ai' = 'user'): Promise<void> => {
  await query(
    'UPDATE chats SET title = $1, title_generated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    [title, source, chatId]
  );
};
