<script setup lang="ts">
import { ref, computed } from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

const props = defineProps<{
  content: string;
  messageId: string;
  isStreaming?: boolean;
}>();

const emit = defineEmits(['retry']);

const copyToClipboard = () => {
  navigator.clipboard.writeText(props.content);
  showCopied.value = true;
  setTimeout(() => {
    showCopied.value = false;
  }, 2000);
};

const retry = () => {
  emit('retry', props.messageId);
};

const showCopied = ref(false);

const renderedContent = computed(() => {
  return md.render(props.content);
});
</script>

<template>
  <div>
    <div class="p-3 rounded-2xl shadow-sm bg-white dark:bg-gray-700 dark:text-white rounded-tl-none border border-gray-200 dark:border-gray-600 relative">
      <div 
        v-html="renderedContent" 
        class="text-sm markdown-content"
      ></div>
      <span v-if="isStreaming" class="inline-block animate-[cursor-blink_1s_step-end_infinite]">▍</span>
      <span v-if="showCopied" class="absolute -top-8 right-0 bg-gray-800 text-white text-xs py-1 px-2 rounded">Copied!</span>
    </div>
    
    <div class="flex justify-start items-center mt-1 space-x-2">
      <button 
        @click="copyToClipboard"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded"
        title="Copy message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button 
        @click="retry"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded"
        title="Regenerate response"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.markdown-content :deep(p) {
  margin: 0.5em 0;
}
.markdown-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5em;
  border-radius: 0.25em;
  overflow-x: auto;
}
.markdown-content :deep(code) {
  font-family: monospace;
}
</style>
