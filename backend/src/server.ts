import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter, apiLimiter, uploadLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import sellerRoutes from './routes/seller.routes';
import buyerRoutes from './routes/buyer.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
}

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || (NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(rateLimiter);

const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lagbe-kichu';

const mongooseOptions: mongoose.ConnectOptions = {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 50000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 50000,
};

if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    logger.info(`MongoDB connected successfully - Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error.message);
    if (NODE_ENV === 'development') {
      logger.error('Troubleshooting steps:');
      logger.error('1. Check your internet connection');
      logger.error('2. Verify MongoDB Atlas IP whitelist');
      logger.error('3. Ensure MongoDB Atlas cluster is running');
      logger.error('4. Verify connection string format');
    }
    if (NODE_ENV === 'development') {
      setTimeout(() => {
        logger.info('Retrying MongoDB connection...');
        mongoose.connect(MONGODB_URI, mongooseOptions).catch(() => {
          logger.error('Reconnection failed');
          process.exit(1);
        });
      }, 5000);
    } else {
      process.exit(1);
    }
  });

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});

// Validate email configuration at startup
const validateEmailConfig = () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailHost || !emailUser || !emailPass) {
    logger.warn('⚠️  Email configuration is missing. Order confirmation emails will not be sent.');
    logger.warn('   Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
  } else {
    logger.info('✅ Email configuration found. Order confirmation emails will be sent.');
  }
};

validateEmailConfig();

app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Lagbe Kichu API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} - Environment: ${NODE_ENV}`);
});

