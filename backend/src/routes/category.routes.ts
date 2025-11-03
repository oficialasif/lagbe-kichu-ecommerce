import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import {
  getAllCategories,
  getSellerCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = express.Router();

router.get('/', apiLimiter, getAllCategories);

router.use(authenticate);
router.use(authorize('seller'));

router.get('/seller', apiLimiter, getSellerCategories);
router.post('/', apiLimiter, createCategory);
router.put('/:id', apiLimiter, updateCategory);
router.delete('/:id', apiLimiter, deleteCategory);

export default router;

