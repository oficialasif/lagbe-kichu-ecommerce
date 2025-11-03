import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Seller who created it
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true, // This automatically creates an index
    },
    slug: {
      type: String,
      required: false, // Will be generated in pre-save hook
      unique: true, // This automatically creates an index
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before saving
categorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew || !this.slug) {
    if (this.name) {
      this.slug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Ensure slug is not empty
      if (!this.slug || this.slug.length === 0) {
        this.slug = `category-${Date.now()}`;
      }
    }
  }
  next();
});

// Ensure slug is always set - custom validator
categorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    if (!this.slug || this.slug.length === 0) {
      this.slug = `category-${Date.now()}`;
    }
  }
  next();
});

// Indexes (name and slug already have indexes from unique: true)
categorySchema.index({ isActive: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);

