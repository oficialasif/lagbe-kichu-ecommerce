import { z } from 'zod';

// Auth Validation Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['seller', 'buyer']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Product Validation Schemas
export const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be positive'),
  discountPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive().optional()
  ),
  discountEndDate: z.union([
    z.string(),
    z.literal(''),
  ]).optional().refine(
    (val) => {
      if (!val || val === '' || val === null || val === undefined) {
        return true;
      }
      const date = new Date(String(val));
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format' }
  ),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  features: z.array(z.string()).optional().default([]),
  isHotCollection: z.coerce.boolean().optional().default(false),
  tags: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional().transform((val) => {
    if (typeof val === 'string') {
      return val.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    }
    return val || [];
  }),
  brand: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  dimensions: z.string().optional(),
  warranty: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Category Validation Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// Order Validation Schemas
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'Order must have at least one item'),
  shippingAddress: z.string().min(10, 'Shipping address is required'),
  paymentMethod: z.enum(['cash-on-delivery', 'bkash']).default('cash-on-delivery'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'approved',
    'rejected',
    'processing',
    'out-for-delivery',
    'completed',
    'cancelled',
  ]),
});

// Review Validation Schema
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Admin Validation Schemas
export const banUserSchema = z.object({
  isBanned: z.boolean(),
});

