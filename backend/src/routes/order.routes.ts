import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { createOrder } from '../controllers/order.controller';

const router = express.Router();

router.post('/', apiLimiter, authenticate, authorize('buyer'), createOrder);

export default router;

