import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { createCategorySchema, updateCategorySchema } from '../utils/validation';
import Category from '../models/Category.model';
import { AuthRequest } from '../middleware/auth';

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isActive } = req.query;
    
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const sellerId = String(req.user._id);
    const { isActive } = req.query;

    const query: any = { createdBy: sellerId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const validatedData = createCategorySchema.parse(req.body);
    const sellerId = req.user._id;

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') },
    });

    if (existingCategory) {
      throw createError('Category with this name already exists', 400);
    }

    const slug = validatedData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `category-${Date.now()}`;

    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
      throw createError('Category with similar name already exists', 400);
    }

    try {
      const category = await Category.create({
        ...validatedData,
        slug,
        createdBy: sellerId,
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category },
      });
    } catch (dbError: any) {
      if (dbError.code === 11000) {
        const duplicateField = Object.keys(dbError.keyPattern || {})[0];
        if (duplicateField === 'slug') {
          const uniqueSlug = `${slug}-${Date.now()}`;
          const category = await Category.create({
            ...validatedData,
            slug: uniqueSlug,
            createdBy: sellerId,
          });
          res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category },
          });
        } else {
          return next(createError('Category already exists', 400));
        }
      } else {
        throw dbError;
      }
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    if (error.code === 11000) {
      return next(createError('Category already exists', 400));
    }
    next(error);
  }
};

export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { id } = req.params;
    const sellerId = String(req.user._id);
    const validatedData = updateCategorySchema.parse(req.body);

    const category = await Category.findById(id);

    if (!category) {
      throw createError('Category not found', 404);
    }

    if (category.createdBy.toString() !== sellerId) {
      throw createError('Not authorized to update this category', 403);
    }

    if (validatedData.name && validatedData.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') },
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw createError('Category with this name already exists', 400);
      }

      const newSlug = validatedData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `category-${Date.now()}`;

      const existingSlug = await Category.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingSlug) {
        throw createError('Category with similar name already exists', 400);
      }

      (validatedData as any).slug = newSlug;
    }

    Object.assign(category, validatedData);
    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { id } = req.params;
    const sellerId = String(req.user._id);

    const category = await Category.findById(id);

    if (!category) {
      throw createError('Category not found', 404);
    }

    if (category.createdBy.toString() !== sellerId) {
      throw createError('Not authorized to delete this category', 403);
    }

    const Product = (await import('../models/Product.model')).default;
    const productsCount = await Product.countDocuments({ category: category.name });

    if (productsCount > 0) {
      throw createError(
        `Cannot delete category. It is used by ${productsCount} product(s)`,
        400
      );
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

