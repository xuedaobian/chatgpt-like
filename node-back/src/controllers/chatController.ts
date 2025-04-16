import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as chatStore from '../store/chatStore';
import { handleDeepSeekStream } from '../services/deepseekService';
import { handleEndpointError } from '../utils/errorHandler';
import { ChatMessage, ChatRequest, RetryRequest, HistoryRequestParams, SessionEvent } from '../types/chat';

export const handleNewMessage = async (req: Request, res: Response): Promise<void> => {
  let currentSessionId: string | undefined = undefined;
  try {
    const { sessionId, newMessageContent }: ChatRequest = req.body;

    // Input Validation
    if (!newMessageContent || typeof newMessageContent !== 'string' || newMessageContent.trim() === '') {
      res.status(400).json({ error: '请求体中必须包含有效的 "newMessageContent"。' });
      return;
    }
    if (sessionId && typeof sessionId !== 'string') {
      res.status(400).json({ error: '如果提供 "sessionId"，它必须是字符串。' });
      return;
    }

    // Get or Create Session History
    let history: ChatMessage[];
    if (sessionId && chatStore.hasHistory(sessionId)) {
      currentSessionId = sessionId;
      history = chatStore.getHistory(currentSessionId)!;
      console.log(`继续会话: ${currentSessionId}`);
    } else {
      currentSessionId = uuidv4();
      history = chatStore.createHistory(currentSessionId);
      console.log(`开始新会话: ${currentSessionId}`);
    }

    // Add User Message
    const userMessage: ChatMessage = { role: 'user', content: newMessageContent };
    chatStore.addMessage(currentSessionId, userMessage);
    console.log(`会话 ${currentSessionId} 追加用户消息:`, userMessage.content);

    // Set SSE Headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send Session ID
    const sessionEvent: SessionEvent = { sessionId: currentSessionId };
    res.write(`event: session\ndata: ${JSON.stringify(sessionEvent)}\n\n`);
    console.log(`已发送 Session ID ${currentSessionId} 给前端`);

    // Process Stream
    await handleDeepSeekStream(res, history, currentSessionId);

  } catch (error: any) {
    // Catch errors *before* starting the stream (e.g., validation, session creation)
    handleEndpointError(error, res, currentSessionId, '聊天');
  }
  // Note: Errors *during* the stream are handled within handleDeepSeekStream
};

export const handleRetryMessage = async (req: Request, res: Response): Promise<void> => {
  let currentSessionId: string | undefined = undefined;
  try {
    const { sessionId }: RetryRequest = req.body;
    currentSessionId = sessionId; // Assign early for error handling

    // Input Validation
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: '请求体中必须包含有效的 "sessionId"。' });
      return;
    }
    if (!chatStore.hasHistory(sessionId)) {
      res.status(404).json({ error: `会话 "${sessionId}" 未找到。` });
      return;
    }

    const history = chatStore.getHistory(currentSessionId)!;

    // History Manipulation
    if (history.length === 0) {
      res.status(400).json({ error: '无法重试空会话。' });
      return;
    }

    const lastMessage = chatStore.getLastMessage(currentSessionId);
    if (lastMessage?.role === 'assistant') {
      const removed = chatStore.removeLastAssistantMessage(currentSessionId);
      if (removed) {
        console.log(`会话 ${currentSessionId} 重试：已移除上一条助手消息。`);
        const newLastMessage = chatStore.getLastMessage(currentSessionId);
        if (!newLastMessage || newLastMessage.role !== 'user') {
          // This case should be rare if logic is correct, but handle defensively
          console.error(`会话 ${currentSessionId} 历史状态异常：移除助手消息后，最后一条不是用户消息。`);
          // Optionally re-add the assistant message if needed, or just error out
          // chatStore.addMessage(currentSessionId, lastMessage); // Restore
          res.status(409).json({ error: '历史记录状态异常，无法重试。' });
          return;
        }
      }
    } else if (lastMessage?.role === 'user') {
      console.log(`会话 ${currentSessionId} 最后消息是用户，将直接基于当前历史重试。`);
      // No action needed, proceed with current history
    } else {
      // Handle cases like empty history (already checked) or system message at the end
      res.status(400).json({ error: '无法重试，最后一条消息不是用户或助手消息。' });
      return;
    }


    // Set SSE Headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    // No session event on retry

    // Process Stream (mark as retry)
    await handleDeepSeekStream(res, history, currentSessionId, true);

  } catch (error: any) {
    handleEndpointError(error, res, currentSessionId, '重试');
  }
};

export const getChatHistory = (req: Request<HistoryRequestParams>, res: Response): void => {
  const { sessionId } = req.params;

  if (!sessionId) {
    res.status(400).json({ error: '必须提供 sessionId 参数。' });
    return;
  }

  const history = chatStore.getHistory(sessionId);

  if (history) {
    console.log(`会话 ${sessionId}：请求历史记录，找到 ${history.length} 条。`);
    res.status(200).json({ sessionId, history });
  } else {
    console.log(`会话 ${sessionId}：请求历史记录，未找到。`);
    res.status(404).json({ error: `会话 "${sessionId}" 未找到。` });
  }
};

export const getAllSessions = (req: Request, res: Response): void => {
  try {
    const sessionIds = chatStore.getAllSessionIds();
    console.log(`请求所有会话列表，找到 ${sessionIds.length} 个。`);
    res.status(200).json({ sessions: sessionIds });
  } catch (error: any) {
    // Use the centralized handler for consistency, though errors here are less likely
    handleEndpointError(error, res, undefined, '获取会话列表');
  }
};
