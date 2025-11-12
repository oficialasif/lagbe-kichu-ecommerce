import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { createOrderSchema } from '../utils/validation';
import Order from '../models/Order.model';
import Product from '../models/Product.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../utils/email';

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const validatedData = createOrderSchema.parse(req.body);
    const buyerId = req.user._id;

    let totalAmount = 0;
    const orderItems: any[] = [];
    let sellerId: string | null = null;

    for (const item of validatedData.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw createError(`Product ${item.product} not found`, 404);
      }

      if (!product.isActive) {
        throw createError(`Product ${product.title} is not available`, 400);
      }

      if (product.stock < item.quantity) {
        throw createError(`Insufficient stock for ${product.title}`, 400);
      }

      if (sellerId && product.seller.toString() !== sellerId) {
        throw createError('All products must be from the same seller', 400);
      }

      sellerId = product.seller.toString();

      const price = product.discountPrice && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price,
      });

      totalAmount += price * item.quantity;
    }

    if (!sellerId) {
      throw createError('Invalid order items', 400);
    }

    const order = await Order.create({
      buyer: buyerId,
      seller: sellerId,
      items: orderItems,
      totalAmount,
      shippingAddress: validatedData.shippingAddress,
      paymentMethod: validatedData.paymentMethod || 'cash-on-delivery',
      status: 'pending',
      paymentStatus: 'pending',
    });

    for (const item of validatedData.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('seller', 'name email phone')
      .populate('buyer', 'name email phone')
      .populate('items.product', 'title images price');

    // Send response immediately, don't wait for email
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order: populatedOrder },
    });

    // Send email notification asynchronously (fire-and-forget)
    // This prevents email issues from blocking the order response
    if (populatedOrder && populatedOrder.buyer && typeof populatedOrder.buyer === 'object' && 'email' in populatedOrder.buyer) {
      const buyer = populatedOrder.buyer as any;
      const orderItems = populatedOrder.items.map((item: any) => ({
        title: item.product?.title || 'Product',
        quantity: item.quantity,
        price: item.price,
      }));

      // Send email in background, don't await
      sendOrderConfirmationEmail(
        buyer.email,
        buyer.name || 'Customer',
        populatedOrder.orderNumber || '',
        {
          totalAmount: populatedOrder.totalAmount,
          items: orderItems,
          shippingAddress: populatedOrder.shippingAddress,
          paymentMethod: populatedOrder.paymentMethod,
        }
      ).catch((emailError: any) => {
        const { logger } = require('../utils/logger');
        logger.error('Failed to send order confirmation email:', emailError.message);
      });
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

