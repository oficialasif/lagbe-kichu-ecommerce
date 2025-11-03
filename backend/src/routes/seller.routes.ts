import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimiter';
import {
  getSellerDashboard,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerOrders,
  updateOrderStatus,
} from '../controllers/seller.controller';
import upload from '../middleware/upload';

const router = express.Router();

router.use(authenticate);
router.use(authorize('seller'));

router.get('/dashboard', apiLimiter, getSellerDashboard);

router.get('/products', apiLimiter, getSellerProducts);
router.post('/products', uploadLimiter, upload.array('images', 5), createProduct);
router.put('/products/:productId', uploadLimiter, upload.array('images', 5), updateProduct);
router.delete('/products/:productId', apiLimiter, deleteProduct);

router.get('/orders', apiLimiter, getSellerOrders);
router.patch('/orders/:orderId/status', apiLimiter, updateOrderStatus);

export default router;

