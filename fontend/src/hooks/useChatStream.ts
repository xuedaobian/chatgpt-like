import { ref } from 'vue';
import { streamChat, type ChatRequestBody } from '@/apis/sse';
import { baseURL } from '@/apis/basicConfig';

// Define the structure for the chat message in the component's history
export interface DisplayMessage {
  id: string; // Unique ID for each message
  role: 'user' | 'assistant' | 'error';
  content: string;
  isStreaming?: boolean; // Optional flag for assistant messages
}

export function useChatStream() {
  const messages = ref<DisplayMessage[]>([]); // Store the chat history
  const currentSessionId = ref<string | undefined>(undefined);
  const error = ref<string | null>(null);
  const isLoading = ref(false);
  let abortController = new AbortController(); // Controller to cancel the stream

  const sendMessage = async (newMessageContent: string) => {
    if (isLoading.value) {
      console.warn("已经在处理消息。"); // Changed to Chinese
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
      content: '', // Start empty
      isStreaming: true,
    };
    messages.value.push(assistantMessage);

    error.value = null;
    isLoading.value = true;
    abortController = new AbortController(); // Create a new controller for this request

    const requestBody: ChatRequestBody = {
      newMessageContent: newMessageContent,
      sessionId: currentSessionId.value, // Send current session ID if available
    };

    try {
      await streamChat(
        baseURL,
        '/api/chat', // 使用固定的聊天端点
        requestBody,
        {
          onSessionId: (sessionId) => {
            console.log("Hook received session ID:", sessionId);
            currentSessionId.value = sessionId;
          },
          onMessageChunk: (contentChunk) => {
            // Find the streaming assistant message and append
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].content += contentChunk;
            }
          },
          onError: (err) => {
            console.error("Hook received error:", err);
            error.value = err instanceof Error ? err.message : String(err);
            // Add an error message to the chat
            messages.value.push({
              id: Date.now().toString() + '-error',
              role: 'error',
              content: `错误: ${error.value}` // Changed to Chinese
            });
            // Mark the current streaming message as finished (with error)
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
              if (!messages.value[msgIndex].content) {
                // Remove empty assistant message placeholder if error occurred before any content
                messages.value.splice(msgIndex, 1);
              }
            }
          },
          onEnd: (finishReason) => {
            console.log("Hook received end signal. Reason:", finishReason);
            // Mark the current streaming message as finished
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
            }
          },
        },
        abortController // Pass the controller
      );
    } catch (err: any) {
      // Catch errors specifically from the streamChat promise itself (e.g., connection refused)
      // Errors during the stream (like parsing) are handled by onError callback.
      if (err.name !== 'AbortError') { // Don't show error if it was manually aborted
        console.error('启动或在流期间出错:', err); // Changed to Chinese
        error.value = err instanceof Error ? err.message : String(err);
        messages.value.push({
          id: Date.now().toString() + '-error',
          role: 'error',
          content: `流错误: ${error.value}` // Changed to Chinese
        });
        // Ensure loading state is reset and streaming flag is off
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value[msgIndex].isStreaming = false;
        }
      } else {
        console.log("用户中止了流。"); // Changed to Chinese
        // If aborted, remove the potentially incomplete assistant message placeholder
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value.splice(msgIndex, 1);
        }
      }
    } finally {
      isLoading.value = false;
      // Ensure the streaming flag is off even if onEnd wasn't called (e.g., abrupt close)
      const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
      if (msgIndex !== -1 && messages.value[msgIndex]?.isStreaming) { // Added optional chaining for safety
        messages.value[msgIndex].isStreaming = false;
        console.warn("流在没有明确 onEnd 信号的情况下结束，标记为完成。"); // Changed to Chinese
      }
    }
  };

  const cancelStream = () => {
    if (isLoading.value) {
      console.log("正在中止流..."); // Changed to Chinese
      abortController.abort();
      isLoading.value = false; // Manually set loading to false
      // Error handling/message cleanup is done in the catch block of sendMessage/retryMessage
    }
  };

  const retryMessage = async (failedMessageId: string) => {
    if (isLoading.value) {
      console.warn("已经在处理消息。"); // Changed to Chinese
      return;
    }
    if (!currentSessionId.value) {
      console.error("无法在没有会话 ID 的情况下重试。"); // Changed to Chinese
      error.value = "无法重试：缺少会话 ID。"; // Changed to Chinese
      return;
    }

    const failedMsgIndex = messages.value.findIndex(m => m.id === failedMessageId);
    if (failedMsgIndex === -1) {
      console.error(`无法重试：未找到 ID 为 ${failedMessageId} 的消息。`); // Changed to Chinese
      error.value = `无法重试：未找到消息。`; // Changed to Chinese
      return;
    }

    // 查找要移除的第一条消息（失败的那条）
    let firstIndexToRemove = failedMsgIndex;
    // 查找要移除的最后一条消息（向前查找，直到遇到用户消息或结束）
    let lastIndexToRemove = failedMsgIndex;
    for (let i = failedMsgIndex + 1; i < messages.value.length; i++) {
      if (messages.value[i].role === 'user') {
        break; // 在下一个用户消息之前停止
      }
      lastIndexToRemove = i;
    }
    const countToRemove = lastIndexToRemove - firstIndexToRemove + 1;
    messages.value.splice(firstIndexToRemove, countToRemove);
    console.log(`为重试移除了从索引 ${firstIndexToRemove} 开始的 ${countToRemove} 条消息。`); // Changed to Chinese


    // 添加新的助手占位符消息
    const assistantMessageId = Date.now().toString() + '-assistant-retry';
    const assistantMessage: DisplayMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // 开始为空
      isStreaming: true,
    };
    messages.value.push(assistantMessage);

    error.value = null;
    isLoading.value = true;
    abortController = new AbortController(); // 为重试请求创建新的控制器

    const retryRequestBody = {
      sessionId: currentSessionId.value,
    };

    try {
      await streamChat(
        baseURL,
        '/api/chat/retry', // 使用固定的重试端点
        retryRequestBody,
        {
          onSessionId: (sessionId) => {
            // 重试时不应发生，但如果发生则记录
            console.warn("在重试期间收到会话 ID:", sessionId); // Changed to Chinese
          },
          onMessageChunk: (contentChunk) => {
            // 找到流式助手消息并追加
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].content += contentChunk;
            }
          },
          onError: (err) => {
            console.error("Hook 在重试期间收到错误:", err); // Changed to Chinese
            error.value = err instanceof Error ? err.message : String(err);
            // 向聊天中添加错误消息
            messages.value.push({
              id: Date.now().toString() + '-error',
              role: 'error',
              content: `重试错误: ${error.value}` // Changed to Chinese
            });
            // 将当前流式消息标记为完成（带错误）
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
              if (!messages.value[msgIndex].content) {
                // 如果在任何内容之前发生错误，则移除空的助手消息占位符
                messages.value.splice(msgIndex, 1);
              }
            }
          },
          onEnd: (finishReason) => {
            console.log("Hook 收到重试的结束信号。原因:", finishReason); // Changed to Chinese
            // 将当前流式消息标记为完成
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false;
            }
          },
        },
        abortController // 传递控制器
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('启动或在重试流期间出错:', err); // Changed to Chinese
        error.value = err instanceof Error ? err.message : String(err);
        messages.value.push({
          id: Date.now().toString() + '-error',
          role: 'error',
          content: `重试流错误: ${error.value}` // Changed to Chinese
        });
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value[msgIndex].isStreaming = false;
        }
      } else {
        console.log("用户中止了重试流。"); // Changed to Chinese
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          messages.value.splice(msgIndex, 1);
        }
      }
    } finally {
      isLoading.value = false;
      const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId);
      if (msgIndex !== -1 && messages.value[msgIndex]?.isStreaming) { // Added optional chaining
        messages.value[msgIndex].isStreaming = false;
        console.warn("重试流在没有明确 onEnd 信号的情况下结束，标记为完成。"); // Changed to Chinese
      }
    }
  };


  // 返回响应式状态和启动流的函数
  return {
    messages,
    currentSessionId,
    error,
    isLoading,
    sendMessage,
    cancelStream,
    retryMessage, // 导出新函数
  };
}