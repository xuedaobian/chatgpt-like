<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  isLoading: boolean;
  error?: string | null;
}>();

const emit = defineEmits(['send', 'cancel']);

const userInput = ref('');

const handleSend = () => {
  if (!userInput.value.trim()) return;
  emit('send', userInput.value);
  userInput.value = '';
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <div>
    <div
      v-if="isLoading"
      class="py-2 px-4 bg-blue-50 dark:bg-gray-800 text-center text-blue-600 dark:text-blue-400 border-t border-blue-100 dark:border-gray-700 flex items-center justify-center"
    >
      <div class="typing-indicator mr-2"></div>
      Assistant is responding...
      <button
        @click="handleCancel"
        class="ml-3 px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full text-xs font-medium transition-colors duration-200 ease-in-out"
      >
        Cancel
      </button>
    </div>

    <div v-if="error" class="py-2 px-4 bg-red-50 dark:bg-red-900/30 text-center font-medium text-red-600 dark:text-red-400 border-t border-red-100 dark:border-red-900/50">
      Error: {{ error }}
    </div>

    <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden pr-1">
        <input
          type="text"
          v-model="userInput"
          placeholder="Type your message..."
          @keyup.enter="handleSend"
          :disabled="isLoading"
          class="flex-grow p-3 px-5 bg-gray-100 dark:bg-gray-700 focus:outline-none dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        />
        <button
          @click="handleSend"
          :disabled="isLoading || !userInput.trim()"
          class="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.typing-indicator {
  display: inline-flex;
  align-items: center;
}

.typing-indicator::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  margin-right: 2px;
  animation: typing 1.5s infinite;
}

.typing-indicator::after {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  margin-left: 2px;
  animation: typing 1.5s infinite;
  animation-delay: 0.5s;
}

@keyframes typing {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}
</style>
