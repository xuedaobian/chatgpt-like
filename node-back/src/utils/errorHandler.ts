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
    // If headers not sent, send a standard JSON error response
    res.status(500).json({
      error: `处理${operation}请求时发生内部服务器错误。`,
      details: errorMessage,
      sessionId: sessionId
    });
  } else if (!res.writableEnded) {
    // If headers sent (likely SSE), try to send an error event within the stream
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
        res.end(); // Ensure the stream is closed after attempting to send the error
      }
    }
  }
  // If headers sent and stream ended, we can't notify the client further, error is logged server-side.
}
