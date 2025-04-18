import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '../config/env';

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

pool.on('connect', () => {
  console.log('已连接到 PostgreSQL 数据库');
});

pool.on('error', (err, client) => {
  console.error('PostgreSQL 连接池发生意外错误', err);
  process.exit(-1); // 如果连接池出现严重错误则退出
});

// 导出一个查询函数以与连接池交互
export const query = async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    // 可选：记录查询执行时间
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('数据库查询出错:', { text, params, error });
    throw error; // 重新抛出错误，由调用者处理
  }
};

// 可选：如果其他地方需要，直接导出连接池
export { pool };

// 可选：添加一个函数以在启动时测试连接
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT NOW()');
    console.log('数据库连接测试成功。');
    return true;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
};

// 新增：数据库初始化函数
export const initializeDatabase = async (): Promise<void> => {
  // Create chats table with new structure
  const createChatsTable = `
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      title_generated_by VARCHAR(10) DEFAULT 'initial' CHECK (title_generated_by IN ('initial', 'ai', 'user')),
      message_count_for_ai_title INTEGER DEFAULT 0
    );
  `;

  // Create messages table with new structure
  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
      content TEXT NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('正在初始化数据库...');
    await pool.query(createChatsTable);
    console.log('表 "chats" 已检查/创建。');
    await pool.query(createMessagesTable);
    console.log('表 "messages" 已检查/创建。');
    console.log('数据库初始化完成。');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error; // 重新抛出错误，以便应用程序启动时可以捕获
  }
};
