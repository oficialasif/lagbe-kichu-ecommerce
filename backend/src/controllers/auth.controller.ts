import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createError } from '../middleware/errorHandler';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import User from '../models/User.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../utils/email';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw createError('User already exists with this email', 400);
    }

    const user = await User.create({
      ...validatedData,
      role: validatedData.role || 'buyer',
    });

    const accessToken = generateAccessToken({
      userId: String(user._id),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: String(user._id),
      role: user.role,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email }).select('+password');
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      throw createError('Account has been banned', 403);
    }

    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }
    const accessToken = generateAccessToken({
      userId: String(user._id),
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: String(user._id),
      role: user.role,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw createError('Refresh token required', 401);
    }

    const { verifyRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user || user.isBanned) {
      throw createError('Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken({
      userId: String(user._id),
      role: user.role,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error: any) {
    next(createError('Invalid refresh token', 401));
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie('refreshToken');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          phone: req.user.phone,
          address: req.user.address,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password - Send reset token to email
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name
      );

      res.json({
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      throw createError('Email could not be sent. Please try again later.', 500);
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);

    const hashedToken = crypto.createHash('sha256').update(validatedData.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      throw createError('Invalid or expired reset token', 400);
    }

    user.password = validatedData.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
};

