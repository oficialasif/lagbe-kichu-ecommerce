import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { createReviewSchema } from '../utils/validation';
import Order from '../models/Order.model';
import Review from '../models/Review.model';
import { AuthRequest } from '../middleware/auth';

export const getBuyerOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const buyerId = String(req.user._id);
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 10)));
    const { status } = req.query;

    const query: any = { buyer: buyerId };
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('seller', 'name email phone')
      .populate('items.product', 'title images price')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
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

export const getOrderDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { orderId } = req.params;
    const buyerId = String(req.user._id);

    const order = await Order.findOne({ _id: orderId, buyer: buyerId })
      .populate('seller', 'name email phone address')
      .populate('items.product');

    if (!order) {
      throw createError('Order not found', 404);
    }

    const review = await Review.findOne({ order: orderId });

    res.json({
      success: true,
      data: {
        order,
        review: review || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { orderId } = req.params;
    const validatedData = createReviewSchema.parse(req.body);
    const buyerId = String(req.user._id);

    const order = await Order.findById(orderId);
    if (!order) {
      throw createError('Order not found', 404);
    }

    if (order.buyer.toString() !== buyerId.toString()) {
      throw createError('Not authorized to review this order', 403);
    }

    if (order.status !== 'completed') {
      throw createError('Can only review completed orders', 400);
    }

    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      throw createError('Review already exists for this order', 400);
    }

    const productId = order.items[0].product;

    const review = await Review.create({
      product: productId,
      buyer: buyerId,
      order: orderId,
      rating: validatedData.rating,
      comment: validatedData.comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    if (error.code === 11000) {
      return next(createError('Review already exists for this order', 400));
    }
    next(error);
  }
};

