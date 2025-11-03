import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'processing' 
  | 'out-for-delivery' 
  | 'completed' 
  | 'cancelled';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: 'cash-on-delivery' | 'bkash';
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: false, // Auto-generated in pre-save hook
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: String,
      required: [true, 'Shipping address is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash-on-delivery', 'bkash'],
      default: 'cash-on-delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processing', 'out-for-delivery', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique order number
orderSchema.pre('save', async function (next) {
  // Only generate if this is a new order and orderNumber doesn't exist
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.orderNumber = `ORD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Indexes
orderSchema.index({ buyer: 1 });
orderSchema.index({ seller: 1 });
// orderNumber already has an index from unique: true
orderSchema.index({ status: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);

