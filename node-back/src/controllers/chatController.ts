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
    const userId = req.body.userId || 'anonymous'; // Get user ID from request or use default

    // 输入验证
    if (!newMessageContent || typeof newMessageContent !== 'string' || newMessageContent.trim() === '') {
      res.status(400).json({ error: '请求体中必须包含有效的 "newMessageContent"。' });
      return;
    }
    if (sessionId && typeof sessionId !== 'string') {
      res.status(400).json({ error: '如果提供 "sessionId"，它必须是字符串。' });
      return;
    }

    // 获取或创建会话历史
    let history: ChatMessage[];
    const sessionExists = sessionId ? await chatStore.hasHistory(sessionId) : false;

    if (sessionId && sessionExists) {
      currentSessionId = sessionId;
      history = await chatStore.getHistory(currentSessionId);
      console.log(`继续会话: ${currentSessionId}`);
    } else {
      currentSessionId = sessionId || uuidv4();
      history = [];
      console.log(`开始新会话 (或使用提供的 ID): ${currentSessionId}`);
    }

    // 添加用户消息
    const userMessage: ChatMessage = { role: 'user', content: newMessageContent };
    await chatStore.addMessage(currentSessionId, userMessage, userId);
    history.push(userMessage);
    console.log(`会话 ${currentSessionId} 追加用户消息:`, userMessage.content);

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 发送会话 ID
    const sessionEvent: SessionEvent = { sessionId: currentSessionId };
    res.write(`event: session\ndata: ${JSON.stringify(sessionEvent)}\n\n`);
    console.log(`已发送 Session ID ${currentSessionId} 给前端`);

    // 处理流
    await handleDeepSeekStream(res, history, currentSessionId);

  } catch (error: any) {
    handleEndpointError(error, res, currentSessionId, '聊天');
  }
};

export const handleRetryMessage = async (req: Request, res: Response): Promise<void> => {
  let currentSessionId: string | undefined = undefined;
  try {
    const { sessionId }: RetryRequest = req.body;
    currentSessionId = sessionId;

    // 输入验证
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: '请求体中必须包含有效的 "sessionId"。' });
      return;
    }
    if (!await chatStore.hasHistory(sessionId)) {
      res.status(404).json({ error: `会话 "${sessionId}" 未找到。` });
      return;
    }

    let history = await chatStore.getHistory(currentSessionId)!;

    // 历史记录操作
    if (history.length === 0) {
      res.status(400).json({ error: '无法重试空会话。' });
      return;
    }

    const lastMessage = history[history.length - 1];

    if (lastMessage?.role === 'assistant') {
      const removed = await chatStore.removeLastAssistantMessage(currentSessionId);
      if (removed) {
        console.log(`会话 ${currentSessionId} 重试：已移除上一条助手消息。`);
        history = await chatStore.getHistory(currentSessionId);
        const newLastMessage = history.length > 0 ? history[history.length - 1] : null;
        if (!newLastMessage || newLastMessage.role !== 'user') {
          console.error(`会话 ${currentSessionId} 历史状态异常：移除助手消息后，最后一条不是用户消息。`);
          res.status(409).json({ error: '历史记录状态异常，无法重试。' });
          return;
        }
      } else {
        console.warn(`会话 ${currentSessionId} 尝试移除助手消息失败 (可能已被移除或不存在)。`);
      }
    } else if (lastMessage?.role === 'user') {
      console.log(`会话 ${currentSessionId} 最后消息是用户，将直接基于当前历史重试。`);
    } else {
      res.status(400).json({ error: '无法重试，最后一条消息不是用户或助手消息。' });
      return;
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 处理流 (标记为重试)
    await handleDeepSeekStream(res, history, currentSessionId, true);

  } catch (error: any) {
    handleEndpointError(error, res, currentSessionId, '重试');
  }
};

export const getChatHistory = async (req: Request<HistoryRequestParams>, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  if (!sessionId) {
    res.status(400).json({ error: '必须提供 sessionId 参数。' });
    return;
  }

  try {
    const history = await chatStore.getHistory(sessionId);

    if (history) {
      console.log(`会话 ${sessionId}：请求历史记录，找到 ${history.length} 条。`);
      res.status(200).json({ sessionId, history });
    } else {
      console.log(`会话 ${sessionId}：请求历史记录，未找到。`);
      res.status(404).json({ error: `会话 "${sessionId}" 未找到。` });
    }
  } catch (error: any) {
    handleEndpointError(error, res, sessionId, '获取历史记录');
  }
};

export const getAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionIds = await chatStore.getAllSessionIds();
    console.log(`请求所有会话列表，找到 ${sessionIds.length} 个。`);
    res.status(200).json({ sessions: sessionIds });
  } catch (error: any) {
    handleEndpointError(error, res, undefined, '获取会话列表');
  }
};
