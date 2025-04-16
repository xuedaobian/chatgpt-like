import { Router } from 'express';
import * as chatController from '../controllers/chatController';

const router = Router();

router.post('/', chatController.handleNewMessage);
router.post('/retry', chatController.handleRetryMessage);
router.get('/history/:sessionId', chatController.getChatHistory);
router.get('/sessions', chatController.getAllSessions);

export default router;
