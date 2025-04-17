import { type Ref } from 'vue';
import { streamChat, type ChatRequestBody } from '@/apis/sse';
import { baseURL } from '@/apis/basicConfig';

// Define the structure for the chat message in the component's history
export interface DisplayMessage {
  id: string; // Unique ID for each message
  role: 'user' | 'assistant' | 'error';
  content: string;
  isStreaming?: boolean; // Optional flag for assistant messages
}

/**
 * 让 useChatStream 支持外部传入状态（messages, sessionId, isLoading, error），
 * 这样每个会话的数据都能独立管理，方便新建/切换会话。
 */
export function useChatStream(
  session: () => {
    messages: Ref<DisplayMessage[]>;
    sessionId?: Ref<string | undefined>;
    isLoading: Ref<boolean>;
    error: Ref<string | null>;
  }
) {
  let abortController = new AbortController();

  const sendMessage = async (newMessageContent: string) => {
    const { messages, sessionId, isLoading, error } = session();
    if (isLoading.value) {
      console.warn("已经在处理消息。");
      return;
    }

    // Add user message immediately
    const userMessage: DisplayMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: newMessageContent
    };
    messages.value.push(userMessage);

    // Prepare for assistant response
    const assistantMessageId = Date.now().toString() + '-assistant';
    const assistantMessage: DisplayMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    messages.value.push(assistantMessage);

    error.value = null;
    isLoading.value = true;
    abortController = new AbortController();

    const requestBody: ChatRequestBody = {
      newMessageContent,
      sessionId: sessionId?.value,
    };

    try {
      await streamChat(
        baseURL,
        '/api/chat',
        requestBody,
        {
          onSessionId: (sid) => {
            if (sessionId) sessionId.value = sid;
          },
          onMessageChunk: (contentChunk) => {
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].content += contentChunk;
            }
          },
          onError: (err) => {
            error.value = err instanceof Error ? err.message : String(err);
            messages.value.push({
              id: Date.now().toString() + '-error',
              role: 'error',
              content: `错误: ${error.value}`
            });
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
              if (!messages.value[msgIndex].content) {
                messages.value.splice(msgIndex, 1);
              }
            }
          },
          onEnd: () => {
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
            }
          },
        },
        abortController
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error.value = err instanceof Error ? err.message : String(err);
        messages.value.push({
          id: Date.now().toString() + '-error',
          role: 'error',
          content: `流错误: ${error.value}`
        });
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value[msgIndex].isStreaming = false;
        }
      } else {
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value.splice(msgIndex, 1);
        }
      }
    } finally {
      isLoading.value = false;
      const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
      if (msgIndex !== -1 && messages.value[msgIndex]?.isStreaming) {
        messages.value[msgIndex].isStreaming = false;
      }
    }
  };

  const cancelStream = () => {
    const { isLoading } = session();
    if (isLoading.value) {
      abortController.abort();
      isLoading.value = false;
    }
  };

  const retryMessage = async (failedMessageId: string) => {
    const { messages, sessionId, isLoading, error } = session();
    if (isLoading.value) {
      console.warn("已经在处理消息。");
      return;
    }
    if (!sessionId?.value) {
      error.value = "无法重试：缺少会话 ID。";
      return;
    }

    const failedMsgIndex = messages.value.findIndex(m => m.id === failedMessageId);
    if (failedMsgIndex === -1) {
      error.value = `无法重试：未找到消息。`;
      return;
    }

    let firstIndexToRemove = failedMsgIndex;
    let lastIndexToRemove = failedMsgIndex;
    for (let i = failedMsgIndex + 1; i < messages.value.length; i++) {
      if (messages.value[i].role === 'user') break;
      lastIndexToRemove = i;
    }
    const countToRemove = lastIndexToRemove - firstIndexToRemove + 1;
    messages.value.splice(firstIndexToRemove, countToRemove);

    const assistantMessageId = Date.now().toString() + '-assistant-retry';
    const assistantMessage: DisplayMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    messages.value.push(assistantMessage);

    error.value = null;
    isLoading.value = true;
    abortController = new AbortController();

    const retryRequestBody = {
      sessionId: sessionId.value,
    };

    try {
      await streamChat(
        baseURL,
        '/api/chat/retry',
        retryRequestBody,
        {
          onSessionId: () => {},
          onMessageChunk: (contentChunk) => {
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].content += contentChunk;
            }
          },
          onError: (err) => {
            error.value = err instanceof Error ? err.message : String(err);
            messages.value.push({
              id: Date.now().toString() + '-error',
              role: 'error',
              content: `重试错误: ${error.value}`
            });
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
              if (!messages.value[msgIndex].content) {
                messages.value.splice(msgIndex, 1);
              }
            }
          },
          onEnd: () => {
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
            }
          },
        },
        abortController
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error.value = err instanceof Error ? err.message : String(err);
        messages.value.push({
          id: Date.now().toString() + '-error',
          role: 'error',
          content: `重试流错误: ${error.value}`
        });
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value[msgIndex].isStreaming = false;
        }
      } else {
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value.splice(msgIndex, 1);
        }
      }
    } finally {
      isLoading.value = false;
      const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
      if (msgIndex !== -1 && messages.value[msgIndex]?.isStreaming) {
        messages.value[msgIndex].isStreaming = false;
      }
    }
  };

  return {
    sendMessage,
    cancelStream,
    retryMessage,
  };
}