<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <header class="bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 px-6 py-4">
    <h1 class="text-2xl font-bold text-white flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2H9V9z" clip-rule="evenodd" />
      </svg>
      {{ title || 'DeepSeek Chat' }}
    </h1>
  </header>
</template>
