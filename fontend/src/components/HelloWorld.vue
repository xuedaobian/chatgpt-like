<script setup lang="ts">
import { useChatStream, type DisplayMessage } from '@/hooks/useChatStream';
import UserMessage from '@/components/UserMessage.vue';
import AssistantMessage from '@/components/AssistantMessage.vue';
import ChatHeader from '@/components/ChatHeader.vue';
import ChatInput from '@/components/ChatInput.vue'

// Use the composable hook
const { messages, error, isLoading, sendMessage, cancelStream, retryMessage } = useChatStream();

const handleSend = (message: string) => {
  sendMessage(message);
};

const handleCancel = () => {
  cancelStream();
};

const handleRetry = (messageId: string) => {
  retryMessage(messageId);
};
</script>

<template>
  <div class="w-full flex h-full">
    <!-- Main chat container -->
    <div class="flex-1 flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
      <!-- Fixed header -->
      <div class="flex-shrink-0">
        <ChatHeader title="DeepSeek Chat" />
      </div>

      <!-- Scrollable messages area -->
      <div
        class="flex-grow overflow-y-auto p-5 bg-gray-50 dark:bg-gray-900 scroll-smooth"
        ref="chatContainer"
      >
        <div
          v-for="message in messages"
          :key="message.id"
          class="mb-4 transition-all duration-300 ease-in-out flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <UserMessage 
            v-if="message.role === 'user'" 
            :content="message.content"
            :isStreaming="message.isStreaming"
          />
          
          <AssistantMessage 
            v-else-if="message.role === 'assistant'" 
            :content="message.content"
            :messageId="message.id"
            :isStreaming="message.isStreaming"
            @retry="handleRetry"
          />
          
          <div v-else class="p-3 rounded-2xl shadow-sm bg-red-100 dark:bg-red-900 dark:text-white text-red-800">
            <pre class="whitespace-pre-wrap font-sans text-sm">{{ message.content }}</pre>
            <div class="text-xs mt-1 font-medium text-left text-red-600 dark:text-red-400">
              Error
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed input area at bottom -->
      <div class="flex-shrink-0">
        <ChatInput 
          :isLoading="isLoading" 
          :error="error"
          @send="handleSend"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes cursor-blink {
  from, to {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
