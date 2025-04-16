import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { Response } from 'express';
import { DEEPSEEK_API_KEY } from '../config/env';
import { ChatMessage, MessageEvent, ErrorEvent } from '../types/chat';
import { addMessage } from '../store/chatStore';

// --- Initialize DeepSeek Client ---
const deepSeek: OpenAI = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: DEEPSEEK_API_KEY,
});

// --- Handle DeepSeek Stream ---
export async function handleDeepSeekStream(
  res: Response,
  history: ChatMessage[],
  sessionId: string,
  isRetry: boolean = false
): Promise<void> {
  let assistantResponseContent = '';
  const logPrefix = `会话 ${sessionId}${isRetry ? ' (重试)' : ''}`;

  try {
    console.log(`${logPrefix} 向 DeepSeek 发送历史 (${history.length}条):`, history);
    const stream: Stream<ChatCompletionChunk> = await deepSeek.chat.completions.create({
      model: "deepseek-chat",
      messages: history,
      stream: true,
    });

    console.log(`${logPrefix} 已发起流式请求，准备转发...`);

    for await (const chunk of stream) {
      const contentChunk: string | null | undefined = chunk.choices[0]?.delta?.content;
      const finish_reason = chunk.choices[0]?.finish_reason;

      if (contentChunk) {
        assistantResponseContent += contentChunk;
        const messageEvent: MessageEvent = { content: contentChunk };
        res.write(`event: message\ndata: ${JSON.stringify(messageEvent)}\n\n`);
      }

      if (finish_reason) {
        console.log(`${logPrefix} DeepSeek 流结束，完成原因:`, finish_reason);
        if (assistantResponseContent.trim()) {
          const assistantMessage: ChatMessage = { role: 'assistant', content: assistantResponseContent };
          // Use chatStore function to add message
          addMessage(sessionId, assistantMessage);
          console.log(`${logPrefix} 追加助手消息:`, assistantMessage.content);
        } else {
          console.log(`${logPrefix} 助手未返回有效内容，不添加到历史。`);
        }
        break; // Exit loop once finished
      }
    }
    console.log(`${logPrefix} 转发完成。`);
    // Ensure stream is properly ended if loop finishes without finish_reason (should not happen with OpenAI spec)
    if (!res.writableEnded) {
      res.end();
    }

  } catch (error: any) {
    console.error(`${logPrefix} 处理 DeepSeek 流时出错:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Store error message in history (optional, consider if this is desired behavior)
    // addMessage(sessionId, { role: 'assistant', content: `[处理流时发生错误: ${errorMessage}]` });

    // Attempt to send error event via SSE if possible
    if (!res.writableEnded) {
      try {
        const errorPayload: ErrorEvent = {
          error: '处理流过程中发生错误。',
          details: errorMessage
        };
        res.write(`event: error\ndata: ${JSON.stringify(errorPayload)}\n\n`);
      } catch (writeError) {
        console.error(`${logPrefix} 尝试写入错误事件到流时出错:`, writeError);
      } finally {
        if (!res.writableEnded) {
          res.end();
        }
      }
    }
    // Do not re-throw here, error is handled by sending SSE event or logging.
    // The controller's main try/catch won't handle this specific stream error anymore.
  }
}
