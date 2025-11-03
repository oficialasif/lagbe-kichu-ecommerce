import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  category: string; // Keep as string for flexibility, but can reference Category model
  price: number;
  discountPrice?: number;
  discountEndDate?: Date;
  images: string[];
  video?: string;
  seller: mongoose.Types.ObjectId;
  stock: number;
  isActive: boolean;
  features: string[]; // Array of product features
  isHotCollection: boolean; // Hot collection flag
  tags: string[]; // Product tags for better search
  brand?: string; // Product brand
  weight?: number; // Product weight in kg
  dimensions?: string; // Product dimensions (e.g., "10x20x5 cm")
  warranty?: string; // Warranty information
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price must be positive'],
    },
    discountEndDate: {
      type: Date,
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one image is required',
      },
    },
    video: {
      type: String,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: {
      type: [String],
      default: [],
    },
    isHotCollection: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      min: [0, 'Weight must be positive'],
    },
    dimensions: {
      type: String,
      trim: true,
    },
    warranty: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ isHotCollection: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ tags: 1 });

export default mongoose.model<IProduct>('Product', productSchema);

