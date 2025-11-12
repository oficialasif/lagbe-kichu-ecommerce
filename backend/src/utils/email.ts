import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add timeout to prevent hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Create transporter lazily (at runtime)
let transporter: ReturnType<typeof createTransporter> | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email configuration not found. Email functionality will be disabled.');
    }
  }
  return transporter;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Nodemailer with timeout
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env');
      return false;
    }

    const mailOptions = {
      from: `"Lagbe Kichu" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
    };

    // Add timeout wrapper to prevent hanging
    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
    });

    const info = await Promise.race([emailPromise, timeoutPromise]) as any;
    logger.info('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error: any) {
    logger.error('❌ Email sending failed:', error.message);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Lagbe Kichu</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0;">Lagbe Kichu</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        
        <p>Hello ${userName},</p>
        
        <p>We received a request to reset your password for your Lagbe Kichu account. Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #ff6b35; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">${resetUrl}</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Lagbe Kichu. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - Lagbe Kichu',
    html,
  });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  email: string,
  userName: string,
  orderNumber: string,
  orderDetails: {
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
    shippingAddress: string;
    paymentMethod: string;
  }
): Promise<boolean> => {
  const itemsList = orderDetails.items
    .map((item) => `• ${item.title} x${item.quantity} - ৳${item.price * item.quantity}`)
    .join('<br>');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed - Lagbe Kichu</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0;">Lagbe Kichu</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">✅ Order Confirmed!</h2>
        
        <p>Hello ${userName},</p>
        
        <p>Thank you for your order! Your order has been received and confirmed.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Order Details:</h3>
        
        <div style="margin: 20px 0;">
          ${itemsList}
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ৳${orderDetails.totalAmount}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery' : 'Bkash'}</p>
          <p style="margin: 5px 0;"><strong>Shipping Address:</strong> ${orderDetails.shippingAddress}</p>
        </div>
        
        <p>We'll notify you once your order is ready to ship and when it's out for delivery.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Lagbe Kichu. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderNumber}`,
    html,
  });
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdateEmail = async (
  email: string,
  userName: string,
  orderNumber: string,
  status: string,
  statusMessage: string
): Promise<boolean> => {
  const statusEmoji: Record<string, string> = {
    approved: '✅',
    processing: '🔄',
    'out-for-delivery': '🚚',
    completed: '🎉',
    rejected: '❌',
    cancelled: '❌',
  };

  const emoji = statusEmoji[status] || '📦';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - Lagbe Kichu</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0;">Lagbe Kichu</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">${emoji} Order Status Update</h2>
        
        <p>Hello ${userName},</p>
        
        <p>${statusMessage}</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #ff6b35;"><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}</p>
        </div>
        
        <p>You can track your order status in your account dashboard.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Lagbe Kichu. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Update - ${orderNumber}`,
    html,
  });
};

/**
 * Send order delivered email
 */
export const sendOrderDeliveredEmail = async (
  email: string,
  userName: string,
  orderNumber: string,
  orderDetails: {
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
  }
): Promise<boolean> => {
  const itemsList = orderDetails.items
    .map((item) => `• ${item.title} x${item.quantity} - ৳${item.price * item.quantity}`)
    .join('<br>');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Delivered - Lagbe Kichu</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b35; margin: 0;">Lagbe Kichu</h1>
        </div>
        
        <h2 style="color: #333; margin-top: 0;">🎉 Your Order Has Been Delivered!</h2>
        
        <p>Hello ${userName},</p>
        
        <p>Great news! Your order has been successfully delivered to your address.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Order Summary:</h3>
        
        <div style="margin: 20px 0;">
          ${itemsList}
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ৳${orderDetails.totalAmount}</p>
        </div>
        
        <p style="margin-top: 30px;">We hope you enjoy your purchase! If you have any questions or concerns, please don't hesitate to contact us.</p>
        
        <p style="margin-top: 20px;">Please take a moment to review your order and share your feedback. Your opinion matters to us!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Lagbe Kichu. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Delivered - ${orderNumber}`,
    html,
  });
};

