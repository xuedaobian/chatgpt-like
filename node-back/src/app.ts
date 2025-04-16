import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index';

const app = express();

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies

// --- API Routes ---
app.use(apiRoutes);

// --- Basic Root Route (Optional) ---
app.get('/', (req, res) => {
  res.send('Chat API Backend is running.');
});

// --- 404 Handler (Optional) ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

export default app;
