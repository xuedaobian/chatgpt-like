import dotenv from 'dotenv';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const PORT = process.env.PORT || 3001;

if (!DEEPSEEK_API_KEY) {
  console.error("错误：请在 .env 文件中设置 DEEPSEEK_API_KEY");
  process.exit(1);
}

export { DEEPSEEK_API_KEY, PORT };
