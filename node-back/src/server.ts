// Load environment variables first
import { PORT } from './config/env';
// Then import the app
import app from './app';

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
  console.log('聊天历史将存储在服务器内存中 (重启后丢失)。');
});
