import { baseURL } from '@/apis/basicConfig';
/**
 * 获取指定会话的聊天历史记录
 * @param sessionId 会话 ID
 * @returns 包含会话历史的 Promise 对象
 */
export async function fetchChatHistory(sessionId: string): Promise<{ sessionId: string; history: any[] }> {
  const backendUrl = baseURL;

  if (!sessionId) {
      throw new Error('获取历史记录需要提供 sessionId。');
  }

  const response = await fetch(`${backendUrl}/api/chat/history/${sessionId}`);

  if (!response.ok) {
      // 尝试解析错误信息
      let errorData;
      try {
          errorData = await response.json();
      } catch (e) {
          // 如果无法解析 JSON，使用状态文本
          throw new Error(`获取历史记录失败: ${response.status} ${response.statusText}`);
      }
      throw new Error(`获取历史记录失败: ${errorData?.error || response.statusText}`);
  }

  return await response.json();
}

/**
* 获取所有聊天历史记录的列表（摘要）
* @returns 包含所有会话 ID 列表的 Promise 对象
* @throws 如果请求失败
* @note 需要后端实现 /api/chat/sessions 端点
*/
export async function fetchAllChatHistories(): Promise<{ sessions: { sessionId: string; title: string }[] }> {
  const backendUrl = baseURL;

  // 注意：后端需要实现此端点 /api/chat/sessions
  const response = await fetch(`${backendUrl}/api/chat/sessions`);

  if (!response.ok) {
      let errorData;
      try {
          errorData = await response.json();
      } catch (e) {
          throw new Error(`获取所有历史记录列表失败: ${response.status} ${response.statusText}`);
      }
      throw new Error(`获取所有历史记录列表失败: ${errorData?.error || response.statusText}`);
  }

  return await response.json();
}