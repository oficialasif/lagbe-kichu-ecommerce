import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import Product from '../models/Product.model';

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 12)));
    const { category, minPrice, maxPrice, isHotCollection, tag } = req.query;

    const query: any = { isActive: true };
    
    if (category && typeof category === 'string') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (minPrice && !isNaN(min) && min >= 0) query.price.$gte = min;
      if (maxPrice && !isNaN(max) && max >= 0) query.price.$lte = max;
    }

    if (isHotCollection === 'true') {
      query.isHotCollection = true;
    }

    if (tag && typeof tag === 'string') {
      query.tags = { $in: [tag] };
    }

    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate('seller', 'name email phone')
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

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('seller', 'name email phone address');

    if (!product) {
      throw createError('Product not found', 404);
    }

    const Review = (await import('../models/Review.model')).default;
    const reviews = await Review.find({ product: id })
      .populate('buyer', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        product,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 12)));
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw createError('Search query is required', 400);
    }

    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find({
      $text: { $search: q },
      isActive: true,
    })
      .populate('seller', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({
      $text: { $search: q },
      isActive: true,
    });

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

export const getProductsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const pageNum = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limitNum = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 12)));

    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find({
      category: category,
      isActive: true,
    })
      .populate('seller', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({
      category: category,
      isActive: true,
    });

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

