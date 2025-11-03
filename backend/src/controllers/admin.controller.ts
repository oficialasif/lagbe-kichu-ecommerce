import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { banUserSchema } from '../utils/validation';
import User from '../models/User.model';
import Order from '../models/Order.model';
import Product from '../models/Product.model';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 10)));
    const { role } = req.query;
    const query: any = {};
    
    if (role && typeof role === 'string') {
      query.role = role;
    }

    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const validatedData = banUserSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.role === 'admin') {
      throw createError('Cannot ban admin users', 403);
    }

    user.isBanned = validatedData.isBanned;
    await user.save();

    res.json({
      success: true,
      message: validatedData.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Order statistics by status
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Revenue calculations
    const revenueStats = await Order.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Daily orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$product._id',
          title: '$product.title',
          quantity: 1,
          revenue: 1,
        },
      },
    ]);

    // Top sellers by revenue
    const topSellers = await Order.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: '$seller',
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller',
        },
      },
      { $unwind: '$seller' },
      {
        $project: {
          sellerId: '$seller._id',
          name: '$seller.name',
          email: '$seller.email',
          orderCount: 1,
          revenue: 1,
        },
      },
    ]);

    const recentOrders = await Order.find()
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSellers,
          totalBuyers,
          totalProducts,
          totalOrders,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
          completedOrders: revenueStats[0]?.orderCount || 0,
        },
        orderStats,
        revenueStats: revenueStats[0] || {
          totalRevenue: 0,
          averageOrderValue: 0,
          orderCount: 0,
        },
        dailyOrders,
        topProducts,
        topSellers,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

