// 首先加载环境变量
import { PORT } from './config/env';
// 然后导入应用
import app from './app';
// 导入数据库连接测试函数
import { testConnection } from './db';

// --- 启动服务器 ---
const startServer = async () => {
  // 在启动服务器之前测试数据库连接
  const dbConnected = await testConnection();
  if (!dbConnected) {
      console.error("无法连接到数据库，服务器未启动。");
      process.exit(1); // 如果数据库连接失败则退出
  }

  app.listen(PORT, () => {
    console.log(`后端服务器运行在 http://localhost:${PORT}`);
    console.log('聊天历史将存储在 PostgreSQL 数据库中。');
  });
};

startServer().catch(error => {
    console.error("启动服务器失败:", error);
    process.exit(1);
});
