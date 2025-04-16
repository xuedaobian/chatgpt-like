import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';

// Define the structure for the request body
export interface ChatRequestBody {
  sessionId?: string;
  newMessageContent?: string; // 改为可选以支持重试
}

// Define the structure for callbacks
export interface ChatCallbacks {
  onSessionId: (sessionId: string) => void;
  onMessageChunk: (content: string) => void;
  onError: (error: any) => void;
  onEnd?: (finishReason?: string) => void; // Optional end callback
}

// Define the structure for session event data
interface SessionEventData {
  sessionId: string;
}

// Define the structure for message event data
interface MessageEventData {
  content: string;
}

// Define the structure for error event data
interface ErrorEventData {
  error: string;
  details?: string;
}

/**
 * Initiates a streaming chat request to the backend.
 * @param apiUrl The base URL of the API endpoint (e.g., 'http://localhost:3001').
 * @param endpointPath The specific API path (e.g., '/api/chat' or '/api/chat/retry').
 * @param requestBody The content for the request (depends on the endpoint).
 * @param callbacks Object containing callback functions for different events.
 * @param ctrl AbortController signal to allow cancellation.
 */
export function streamChat(
  apiUrl: string,
  endpointPath: string, // 添加端点路径参数
  requestBody: Partial<ChatRequestBody> & { sessionId?: string }, // 更灵活的请求体
  callbacks: ChatCallbacks,
  ctrl: AbortController
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullUrl = `${apiUrl}${endpointPath}`; // 构建完整 URL
    console.log(`Streaming from: ${fullUrl}`); // 记录调用的端点

    fetchEventSource(fullUrl, { // 使用 fullUrl
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
      signal: ctrl.signal,

      onopen: async (response) => {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log(`SSE connection opened successfully to ${endpointPath}.`);
          // Connection is open, ready to receive events.
        } else {
          // Handle non-SSE responses or errors
          const errorText = await response.text();
          console.error(`Failed to open SSE connection to ${endpointPath}: ${response.status} ${response.statusText}`, errorText);
          const error = new Error(`Failed to open SSE connection to ${endpointPath}: ${response.status} ${response.statusText} - ${errorText}`);
          callbacks.onError(error);
          reject(error); // Reject the promise on connection failure
        }
      },

      onmessage: (msg: EventSourceMessage) => {
        // console.log("Received SSE message:", msg); // Debugging
        try {
          if (msg.event === 'session') {
            // 应该只在初始聊天时发生，而不是重试
            const data: SessionEventData = JSON.parse(msg.data);
            if (data.sessionId) {
              callbacks.onSessionId(data.sessionId);
            } else {
              console.warn("Received session event without sessionId:", msg.data);
            }
          } else if (msg.event === 'message') {
            const data: MessageEventData = JSON.parse(msg.data);
            if (typeof data.content === 'string') {
              callbacks.onMessageChunk(data.content);
            } else {
              console.warn("Received message event with invalid content:", msg.data);
            }
          } else if (msg.event === 'error') {
            // Handle custom error events sent from the server stream
            const data: ErrorEventData = JSON.parse(msg.data);
            console.error("Received error event from server:", data);
            callbacks.onError(new Error(data.error + (data.details ? `: ${data.details}` : '')));
            // Optionally abort the connection if server sends an error event
            // ctrl.abort();
          }
          // Add handling for 'end' event if implemented on the server
          // else if (msg.event === 'end') {
          //     const data: EndEventData = JSON.parse(msg.data);
          //     if (callbacks.onEnd) {
          //         callbacks.onEnd(data.finish_reason);
          //     }
          // }
          else if (msg.event === '' || msg.event === 'message') {
            // Handle default/unnamed events if server sends them without 'event:' line
            // This might happen if server only sends `data: ...\n\n`
            // Adjust parsing based on expected data format for default events
            console.warn("Received unnamed/default event:", msg.data);
            // Example: Assume default event is a message chunk
            // try {
            //    const data: MessageEventData = JSON.parse(msg.data);
            //    if (typeof data.content === 'string') {
            //       callbacks.onMessageChunk(data.content);
            //    }
            // } catch (parseError) {
            //    console.error("Failed to parse unnamed event data:", parseError, msg.data);
            // }
          }
        } catch (e) {
          console.error("Error parsing SSE message data:", e, msg);
          callbacks.onError(new Error(`Failed to parse SSE message: ${e}`));
        }
      },

      onclose: () => {
        console.log(`SSE connection to ${endpointPath} closed.`);
        if (callbacks.onEnd) {
          callbacks.onEnd(); // Notify that the stream has ended naturally
        }
        resolve(); // Resolve the promise when the connection closes normally
      },

      onerror: (err) => {
        console.error(`SSE connection error on ${endpointPath}:`, err);
        // This handler is for network errors or errors thrown by fetchEventSource itself.
        // It might be called if the connection is lost, or if onopen/onmessage throws.
        callbacks.onError(err);
        // Rethrowing the error will ensure the promise is rejected.
        // If you don't rethrow, fetchEventSource might retry depending on configuration.
        // Since we resolve/reject in onopen/onclose, rethrowing might be redundant
        // unless specific retry logic is desired (which isn't configured here).
        reject(err); // Reject the promise on fetchEventSource errors
        // IMPORTANT: Do not call ctrl.abort() here unless you want to prevent retries.
        // fetchEventSource handles retries internally based on the error type.
        // Throwing the error signals fetchEventSource to stop.
        throw err;
      },
    });
  });
}
