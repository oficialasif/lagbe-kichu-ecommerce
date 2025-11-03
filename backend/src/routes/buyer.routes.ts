import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import {
  getBuyerOrders,
  getOrderDetails,
  createReview,
} from '../controllers/buyer.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('buyer'));

router.get('/orders', apiLimiter, getBuyerOrders);
router.get('/orders/:orderId', apiLimiter, getOrderDetails);
router.post('/orders/:orderId/review', apiLimiter, createReview);

export default router;

