<script setup lang="ts">
import { ref } from "vue";
import ChatHistory from "./ChatHistory.vue";

defineProps<{
  histories?: Array<{ id: string; title: string; active?: boolean }>;
}>();

const emit = defineEmits(["select", "new-chat"]);

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const handleSelect = (id: string) => {
  emit("select", id);
};

const handleNewChat = () => {
  emit("new-chat");
};
</script>

<template>
  <div
    class="h-full flex flex-col bg-gray-50 dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 shadow-sm"
    :class="isCollapsed ? 'w-16' : 'w-64'"
    style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  >
    <!-- Header with expand/collapse icon -->
    <div
      class="py-4 px-3 flex items-center border-b border-gray-200 dark:border-gray-700"
      :class="!isCollapsed ? 'justify-between' : ''"
    >
      <h2
        v-if="!isCollapsed"
        class="font-semibold text-gray-800 dark:text-gray-100 text-lg"
      >
        deepChat
      </h2>
      <button
        @click="toggleSidebar"
        class="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        :class="isCollapsed ? 'mx-auto' : ''"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-600 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="!isCollapsed"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    <!-- New Chat button area -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <button
        @click="handleNewChat"
        class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span v-if="!isCollapsed">New Chat</span>
      </button>
    </div>

    <!-- Chat History component (middle section) -->
    <div class="flex-grow overflow-hidden">
      <!-- Compact view when sidebar is collapsed -->
      <div v-if="isCollapsed" class="p-2 overflow-y-auto h-full">
        <div
          v-if="!histories || histories.length === 0"
          class="text-center text-gray-500 dark:text-gray-400 text-xs mt-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mx-auto mb-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          No chats
        </div>
        <button
          v-for="history in histories"
          :key="history.id"
          @click="handleSelect(history.id)"
          class="w-full my-1.5 p-2 rounded-lg transition-colors flex items-center justify-center"
          :class="
            history.active
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-200  dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      </div>

      <!-- Use full ChatHistory when sidebar is expanded -->
      <div v-else class="h-full">
        <ChatHistory
          :histories="histories"
          @select="handleSelect"
          @new-chat="handleNewChat"
          class="h-full chat-history-in-sidebar"
        />
      </div>
    </div>

    <!-- Footer with user information -->
    <div
      class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50"
    >
      <div class="flex items-center" :class="isCollapsed ? 'justify-center' : ''">
        <div
          class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300 ring-2 ring-white dark:ring-gray-700"
        >
          <span class="text-sm font-medium">U</span>
        </div>
        <div v-if="!isCollapsed" class="ml-3 overflow-hidden">
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            User
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Free Tier</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-history-in-sidebar :deep(.p-3.border-t) {
  display: none; /* Hide the New Chat button from ChatHistory when in sidebar */
}

.chat-history-in-sidebar :deep(.border-b) {
  display: none; /* Hide the header from ChatHistory when in sidebar */
}

.chat-history-in-sidebar :deep(> div) {
  border: none; /* Remove border from ChatHistory component */
  @apply bg-transparent;
}

/* Add subtle hover effect to user profile area */
.p-3.border-t {
  @apply transition-colors cursor-pointer;
}
</style>
