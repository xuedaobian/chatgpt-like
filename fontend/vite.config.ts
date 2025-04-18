import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 导入 path 模块
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})
