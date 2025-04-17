import dotenv from 'dotenv';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE_URL = process.env.DEEPSEEK_API_BASE_URL;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL;

const PORT = process.env.PORT || 3001;

// Database Configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

if (!DEEPSEEK_API_KEY) {
  console.error("错误：请在 .env 文件中设置 DEEPSEEK_API_KEY");
  process.exit(1);
}

// Validate essential DB config
if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error("错误：请在 .env 文件中设置 DB_USER, DB_PASSWORD, 和 DB_NAME");
    process.exit(1);
}

export {
    DEEPSEEK_API_KEY,
    DEEPSEEK_API_BASE_URL,
    DEEPSEEK_MODEL,
    PORT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
};
