import express from 'express';
import { apiLimiter } from '../middleware/rateLimiter';
import {
  getAllProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
} from '../controllers/product.controller';

const router = express.Router();

router.get('/', apiLimiter, getAllProducts);
router.get('/search', apiLimiter, searchProducts);
router.get('/category/:category', apiLimiter, getProductsByCategory);
router.get('/:id', apiLimiter, getProductById);

export default router;

