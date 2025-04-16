<script setup lang="ts">
defineProps<{
  histories?: Array<{id: string, title: string, active?: boolean}>
}>();

const emit = defineEmits(['select', 'new-chat']);

const handleNewChat = () => {
  emit('new-chat');
};
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="font-medium text-gray-700 dark:text-gray-200">Chat History</h2>
    </div>
    <div class="overflow-y-auto">
      <div 
        v-if="!histories || histories.length === 0" 
        class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm"
      >
        No history yet
      </div>
      <button
        v-for="history in histories"
        :key="history.id"
        @click="emit('select', history.id)"
        class="w-full text-left p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center"
        :class="history.active ? 'bg-gray-200 dark:bg-gray-700' : ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span class="text-sm text-gray-700 dark:text-gray-200 truncate">{{ history.title }}</span>
      </button>
    </div>
    <div class="p-3 border-t border-gray-200 dark:border-gray-700">
      <button 
        @click="handleNewChat"
        class="w-full py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
      >
        New Chat
      </button>
    </div>
  </div>
</template>
