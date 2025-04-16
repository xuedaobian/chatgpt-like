import { Response } from 'express';
import { ErrorEvent } from '../types/chat';

export function handleEndpointError(
  error: any,
  res: Response,
  sessionId: string | undefined,
  operation: string
): void {
  console.error(`会话 ${sessionId || '(未知)'} ${operation}处理出错:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (!res.headersSent) {
    // 如果响应头未发送，发送标准的 JSON 错误响应
    res.status(500).json({
      error: `处理${operation}请求时发生内部服务器错误。`,
      details: errorMessage,
      sessionId: sessionId
    });
  } else if (!res.writableEnded) {
    // 如果响应头已发送（可能是 SSE），尝试在流中发送错误事件
    try {
      const errorPayload: ErrorEvent = {
        error: `处理${operation}过程中发生错误。`,
        details: errorMessage
      };
      res.write(`event: error\ndata: ${JSON.stringify(errorPayload)}\n\n`);
    } catch (writeError) {
      console.error(`尝试写入错误事件到流时出错 (${operation}):`, writeError);
    } finally {
      if (!res.writableEnded) {
        res.end(); // 确保在尝试发送错误后关闭流
      }
    }
  }
  // 如果响应头已发送且流已结束，我们无法进一步通知客户端，错误已在服务器端记录。
}
