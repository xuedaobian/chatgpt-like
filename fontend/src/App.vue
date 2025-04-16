<script setup lang="ts">
import { ref, onMounted } from "vue";
import HelloWorld from "@/components/HelloWorld.vue";
import Sidebar from "@/components/Sidebar.vue";

// Import the API function
import { fetchChatHistory, fetchAllChatHistories } from "@/apis/records";

const chatHistories = ref<Array<{ id: string; title: string; active: boolean }>>([]); // Initialize with type


const selectHistory = (id: string) => {
  chatHistories.value = chatHistories.value.map((h) => ({
    ...h,
    active: h.id === id,
  }));
  // Potentially fetch the specific history details here using fetchChatHistory(id)
};

const startNewChat = () => {
  chatHistories.value = chatHistories.value.map((h) => ({
    ...h,
    active: false,
  }));

  const newId = Date.now().toString();

  const newChat = {
    id: newId,
    title: "New Chat", // Changed default title
    active: true,
  };

  chatHistories.value = [newChat, ...chatHistories.value];
};

// Fetch the list of chat histories when the component mounts
onMounted(() => {
  fetchAllChatHistories()
    .then((res) => {
      console.log("Fetched chat histories:", res);
      chatHistories.value = res.sessions.map((item) => ({
        id: item.id,
        title: item.title || `Chat ${item.id.substring(0, 8)}`,
        active: false, // Initially no chat is active
      }));
    })
    .catch((err) => {
      console.error("Error fetching chat histories:", err);
      // Optionally: Show an error message to the user
    });
})
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
      <HelloWorld />
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

html,
body {
  height: 100%;
}

#app {
  height: 100%;
}

/* Add styles for sidebar positioning */
.sidebar-container {
  position: sticky;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #f9fafb;
}
</style>
