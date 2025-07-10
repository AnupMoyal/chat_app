// src/routes/messageRoutes.js
import express from 'express';
import { getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', protect, getMessages); // /api/messages/:userId or :roomId

export default router;
