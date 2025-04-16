import { ChatMessage } from '../types/chat';
import { query } from '../db'; // 导入查询函数

// --- 聊天记录的数据库操作 ---

// 注意：假设有一个名为 'chat_messages' 的表，包含以下列：
// id SERIAL PRIMARY KEY, session_id VARCHAR(255), role VARCHAR(50), content TEXT, created_at TIMESTAMPTZ DEFAULT NOW()

/**
 * 检查给定会话 ID 是否存在聊天记录。
 */
export const hasHistory = async (sessionId: string): Promise<boolean> => {
  const result = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM chat_messages WHERE session_id = $1)',
    [sessionId]
  );
  return result.rows[0]?.exists ?? false;
};

/**
 * 检索给定会话 ID 的聊天记录，按创建时间排序。
 */
export const getHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const result = await query<ChatMessage>(
    'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  // 将数据库行映射到 ChatMessage 对象（假设列名匹配）
  return result.rows;
};

/**
 * 向给定会话 ID 的聊天记录中添加新消息。
 */
export const addMessage = async (sessionId: string, message: ChatMessage): Promise<void> => {
  await query(
    'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
    [sessionId, message.role, message.content]
  );
};

/**
 * 检索给定会话 ID 的聊天记录中最后添加的消息。
 */
export const getLastMessage = async (sessionId: string): Promise<ChatMessage | null> => {
  const result = await query<ChatMessage>(
    'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
    [sessionId]
  );
  return result.rows[0] || null;
};

/**
 * 如果最后一条消息来自助手，则移除该消息。
 * 如果移除了消息，则返回 true，否则返回 false。
 */
export const removeLastAssistantMessage = async (sessionId: string): Promise<boolean> => {
  // 查找最后一条消息的 ID
  const lastMsgRes = await query<{ id: number; role: string }>(
    'SELECT id, role FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
    [sessionId]
  );

  if (lastMsgRes.rows.length === 0 || lastMsgRes.rows[0].role !== 'assistant') {
    return false; // 没有消息或最后一条消息不是来自助手
  }

  const lastMessageId = lastMsgRes.rows[0].id;

  // 按 ID 删除消息
  const deleteResult = await query(
    'DELETE FROM chat_messages WHERE id = $1',
    [lastMessageId]
  );

  return (deleteResult.rowCount ?? 0) > 0;
};

/**
 * 检索历史记录中所有唯一的会话 ID 列表。
 */
export const getAllSessionIds = async (): Promise<string[]> => {
  const result = await query<{ session_id: string }>(
    'SELECT DISTINCT session_id FROM chat_messages ORDER BY session_id'
  );
  return result.rows.map((row: { session_id: string }) => row.session_id);
};

/**
 * 创建历史记录（对于数据库是空操作，历史记录通过添加消息隐式创建）。
 * 保留以备将来使用或保持一致性，但不与数据库交互。
 */
export const createHistory = (sessionId: string): ChatMessage[] => {
    // 在数据库上下文中，当添加第一条消息时，历史记录会隐式创建。
    // 如果需要，我们可以在这里插入一条系统消息。
    console.log(`会话 ${sessionId} 的历史记录将在添加第一条消息时在数据库中创建。`);
    return []; // 返回空数组，实际历史记录通过 getHistory 获取
};
