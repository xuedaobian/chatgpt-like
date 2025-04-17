<script setup lang="ts">
import { ref, reactive, onMounted, toRef } from "vue";
import HelloWorld from "@/components/HelloWorld.vue";
import Sidebar from "@/components/Sidebar.vue";
import { useChatStream, type DisplayMessage } from '@/hooks/useChatStream';
import { fetchChatHistory, fetchAllChatHistories } from "@/apis/records";

interface ChatSession {
  id: string;
  title: string;
  messages: DisplayMessage[];
  sessionId?: string;
  isLoading: boolean;
  error: string | null;
}

const chatHistories = ref<Array<{ id: string; title: string; active: boolean }>>([]);
const sessions = reactive<Record<string, ChatSession>>({});
const currentSessionId = ref<string | null>(null);

// 初始化所有历史
onMounted(async () => {
  const res = await fetchAllChatHistories();
  chatHistories.value = res.sessions.map((item: any) => ({
    id: item.id,
    title: item.title || `Chat ${item.id.substring(0, 8)}`,
    active: false,
  }));
});

// 切换会话
const selectHistory = async (id: string) => {
  chatHistories.value.forEach(h => h.active = h.id === id);
  currentSessionId.value = id;
  if (!sessions[id]) {
    // 首次加载
    const res = await fetchChatHistory(id);
    sessions[id] = {
      id,
      title: res.title || `Chat ${id.substring(0, 8)}`,
      messages: res.history || [],
      sessionId: id,
      isLoading: false,
      error: null,
    };
  }
};

// 新建会话
const startNewChat = () => {
  const newId = Date.now().toString();
  chatHistories.value.forEach(h => h.active = false);
  chatHistories.value.unshift({ id: newId, title: "New Chat", active: true });
  sessions[newId] = {
    id: newId,
    title: "New Chat",
    messages: [],
    sessionId: undefined,
    isLoading: false,
    error: null,
  };
  currentSessionId.value = newId;
};

// 统一的流式 hook，每次切换会话时重建
const {
  sendMessage,
  cancelStream,
  retryMessage,
} = useChatStream(
  () => {
    const id = currentSessionId.value!;
    // Use toRef to create refs for the properties needed by the hook
    return {
      messages: toRef(sessions[id], 'messages'),
      sessionId: toRef(sessions[id], 'sessionId'),
      isLoading: toRef(sessions[id], 'isLoading'),
      error: toRef(sessions[id], 'error'),
    };
  }
);

</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <div class="sidebar-container border-r border-gray-200 shadow-md">
      <Sidebar
        :histories="chatHistories"
        @select="selectHistory"
        @new-chat="startNewChat"
      />
    </div>
    <div class="flex-1 flex justify-center items-start py-2 h-full">
      <div class="w-[800px] h-full">
        <HelloWorld
          v-if="currentSessionId"
          :messages="sessions[currentSessionId]?.messages"
          :isLoading="sessions[currentSessionId]?.isLoading"
          :error="sessions[currentSessionId]?.error"
          @send="sendMessage"
          @cancel="cancelStream"
          @retry="retryMessage"
        />
      </div>
    </div>
  </div>
</template>