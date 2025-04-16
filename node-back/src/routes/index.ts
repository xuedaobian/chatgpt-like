import { Router } from 'express';
import chatRoutes from './chatRoutes';

const router = Router();

router.use('/api/chat', chatRoutes);
// Add other route groups here if needed, e.g., router.use('/api/users', userRoutes);

export default router;
