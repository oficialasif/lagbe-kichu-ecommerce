import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import {
  getAllUsers,
  banUser,
  getAdminDashboard,
} from '../controllers/admin.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', apiLimiter, getAllUsers);
router.patch('/users/:userId/ban', apiLimiter, banUser);
router.get('/dashboard', apiLimiter, getAdminDashboard);

export default router;

