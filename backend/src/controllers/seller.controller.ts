import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { createProductSchema, updateProductSchema, updateOrderStatusSchema } from '../utils/validation';
import Product from '../models/Product.model';
import Order from '../models/Order.model';
import { AuthRequest } from '../middleware/auth';
import {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
  uploadBufferToCloudinary,
} from '../utils/cloudinary';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export const getSellerDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const sellerId = req.user._id;

    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const activeProducts = await Product.countDocuments({ seller: sellerId, isActive: true });
    const totalOrders = await Order.countDocuments({ seller: sellerId });

    // Order statistics by status
    const orderStats = await Order.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          seller: sellerId,
          status: 'completed',
        },
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
          seller: sellerId,
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

    // Top performing products (by quantity sold)
    const topProducts = await Order.aggregate([
      { $match: { seller: sellerId } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 },
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
          image: { $arrayElemAt: ['$product.images', 0] },
          price: '$product.price',
          quantity: 1,
          revenue: 1,
          orderCount: 1,
        },
      },
    ]);

    const recentOrders = await Order.find({ seller: sellerId })
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          activeProducts,
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
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const sellerId = req.user._id;
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 10)));
    const { isActive } = req.query;

    const query: any = { seller: sellerId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
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

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    // Parse form data - handle string to number conversion and date conversion
    const formData: any = {
      ...req.body,
      price: req.body.price ? Number(req.body.price) : undefined,
      discountPrice: req.body.discountPrice ? (req.body.discountPrice === '' ? undefined : Number(req.body.discountPrice)) : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
      discountEndDate: req.body.discountEndDate && req.body.discountEndDate !== '' 
        ? req.body.discountEndDate 
        : undefined,
      // Handle new fields
      features: req.body.features 
        ? (Array.isArray(req.body.features) ? req.body.features : req.body.features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0))
        : [],
      isHotCollection: req.body.isHotCollection === 'true' || req.body.isHotCollection === true,
      tags: req.body.tags 
        ? (typeof req.body.tags === 'string' 
            ? req.body.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
            : Array.isArray(req.body.tags) ? req.body.tags : [])
        : [],
      brand: req.body.brand || undefined,
      weight: req.body.weight ? Number(req.body.weight) : undefined,
      dimensions: req.body.dimensions || undefined,
      warranty: req.body.warranty || undefined,
    };

    const validatedData = createProductSchema.parse(formData);

    // Handle file uploads
    const images: string[] = [];
    
    // Check if Cloudinary is configured
    const useCloudinary = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;
    
    if (useCloudinary) {
      logger.info('Cloudinary configured');
    } else {
      logger.info('Cloudinary not configured, using local storage');
    }

    if (req.files && Array.isArray(req.files)) {
      if (useCloudinary) {
        logger.debug('Uploading images to Cloudinary...');
        for (const file of req.files) {
          if (file.mimetype.startsWith('image/')) {
            try {
              const result = await uploadImageToCloudinary(file.path);
              images.push(result.secure_url);
              
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                logger.debug(`Deleted local file: ${file.path}`);
              }
            } catch (error: any) {
              const errorMsg = error?.message || error?.toString() || 'Unknown error';
              logger.error('Cloudinary upload error:', errorMsg);
              logger.error('Falling back to local storage');
              
              const filename = path.basename(file.path);
              const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
              const localUrl = `${baseUrl}/uploads/${filename}`;
              images.push(localUrl);
            }
          }
        }
      } else {
        logger.debug('Using local file storage');
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const fileArray = Array.isArray(req.files) ? req.files : [];
        images.push(...fileArray
          .filter((file) => file.mimetype.startsWith('image/'))
          .map((file) => {
            const filename = path.basename(file.path);
            const url = `${baseUrl}/uploads/${filename}`;
            return url;
          })
        );
      }
    }

    if (images.length === 0) {
      throw createError('At least one image is required', 400);
    }

    let video: string | undefined = undefined;
    if (req.files && Array.isArray(req.files)) {
      const videoFile = req.files.find((file) => 
        file.mimetype.startsWith('video/')
      );
      
      if (videoFile) {
        if (useCloudinary) {
          try {
            const result = await uploadVideoToCloudinary(videoFile.path);
            video = result.secure_url;
            if (fs.existsSync(videoFile.path)) {
              fs.unlinkSync(videoFile.path);
            }
          } catch (error: any) {
            logger.error('Cloudinary video upload error:', error);
            const filename = path.basename(videoFile.path);
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            video = `${baseUrl}/uploads/${filename}`;
          }
        } else {
          const filename = path.basename(videoFile.path);
          const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
          video = `${baseUrl}/uploads/${filename}`;
        }
      }
    }

    logger.debug(`Creating product with ${images.length} images`);

    const product = await Product.create({
      ...validatedData,
      images,
      video,
      seller: String(req.user._id),
      discountPrice: validatedData.discountPrice || undefined,
      discountEndDate: validatedData.discountEndDate && validatedData.discountEndDate !== '' 
        ? (() => {
            try {
              const date = new Date(validatedData.discountEndDate);
              return isNaN(date.getTime()) ? undefined : date;
            } catch {
              return undefined;
            }
          })()
        : undefined,
    });

    logger.info(`Product created with ID: ${product._id}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { productId } = req.params;
    
    // Parse form data - handle string to number conversion and new fields
    const formData: any = {
      ...req.body,
      price: req.body.price ? Number(req.body.price) : undefined,
      discountPrice: req.body.discountPrice ? (req.body.discountPrice === '' ? undefined : Number(req.body.discountPrice)) : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
      discountEndDate: req.body.discountEndDate && req.body.discountEndDate !== '' 
        ? req.body.discountEndDate 
        : undefined,
      // Handle new fields
      features: req.body.features !== undefined
        ? (Array.isArray(req.body.features) ? req.body.features : req.body.features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0))
        : undefined,
      isHotCollection: req.body.isHotCollection !== undefined 
        ? (req.body.isHotCollection === 'true' || req.body.isHotCollection === true)
        : undefined,
      tags: req.body.tags !== undefined
        ? (typeof req.body.tags === 'string' 
            ? req.body.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
            : Array.isArray(req.body.tags) ? req.body.tags : [])
        : undefined,
      brand: req.body.brand !== undefined ? req.body.brand : undefined,
      weight: req.body.weight ? Number(req.body.weight) : undefined,
      dimensions: req.body.dimensions !== undefined ? req.body.dimensions : undefined,
      warranty: req.body.warranty !== undefined ? req.body.warranty : undefined,
    };

    const validatedData = updateProductSchema.parse(formData);

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    if (String(product.seller) !== String(req.user._id)) {
      throw createError('Not authorized to update this product', 403);
    }

    // Handle file uploads
    if (req.files && Array.isArray(req.files)) {
      const newImages = req.files
        .filter((file) => file.mimetype.startsWith('image/'))
        .map((file) => file.path);
      
      product.images = [...product.images, ...newImages];
    }

    // Handle video upload
    const video = Array.isArray(req.files) 
      ? req.files.find((file) => 
          file.mimetype.startsWith('video/')
        )?.path
      : undefined;

    if (video) {
      product.video = video;
    }

    Object.assign(product, validatedData);
    if (validatedData.discountEndDate) {
      product.discountEndDate = new Date(validatedData.discountEndDate);
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    if (String(product.seller) !== String(req.user._id)) {
      throw createError('Not authorized to delete this product', 403);
    }

    await Product.findByIdAndDelete(productId);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const sellerId = req.user._id;
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 10)));
    const { status } = req.query;

    const query: any = { seller: sellerId };
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('buyer', 'name email phone address')
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

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { orderId } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'title images price');
    
    if (!order) {
      throw createError('Order not found', 404);
    }

    if (String(order.seller) !== String(req.user._id)) {
      throw createError('Not authorized to update this order', 403);
    }

    const oldStatus = order.status;
    order.status = validatedData.status;
    await order.save();

    try {
      const { sendOrderStatusUpdateEmail, sendOrderDeliveredEmail } = await import('../utils/email');
      
      if (order.buyer && typeof order.buyer === 'object' && 'email' in order.buyer) {
        const buyer = order.buyer as any;
        const statusMessages: Record<string, string> = {
          'approved': `Your order #${order.orderNumber} has been approved by the seller and is being processed.`,
          'processing': `Your order #${order.orderNumber} is now being processed and will be prepared for shipment soon.`,
          'out-for-delivery': `Great news! Your order #${order.orderNumber} is out for delivery and will arrive at your address soon.`,
          'completed': `Your order #${order.orderNumber} has been delivered successfully!`,
          'rejected': `Unfortunately, your order #${order.orderNumber} has been rejected by the seller.`,
          'cancelled': `Your order #${order.orderNumber} has been cancelled.`,
        };

        const statusMessage = statusMessages[validatedData.status] || `Your order #${order.orderNumber} status has been updated to ${validatedData.status}.`;

        // Special email for completed/delivered status
        if (validatedData.status === 'completed') {
          const orderItems = order.items.map((item: any) => ({
            title: item.product?.title || 'Product',
            quantity: item.quantity,
            price: item.price,
          }));

          await sendOrderDeliveredEmail(
            buyer.email,
            buyer.name || 'Customer',
            order.orderNumber || '',
            {
              totalAmount: order.totalAmount,
              items: orderItems,
            }
          );
        } else {
          await sendOrderStatusUpdateEmail(
            buyer.email,
            buyer.name || 'Customer',
            order.orderNumber || '',
            validatedData.status,
            statusMessage
          );
        }
      }
    } catch (emailError: any) {
      logger.error('Failed to send order status update email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

