import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  signup
);

// POST /api/auth/verify-email
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('otp').trim().notEmpty().withMessage('OTP is required')
  ],
  verifyEmail
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
  ],
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    body('otp').trim().notEmpty().withMessage('OTP is required')
  ],
  resetPassword
);

export default router;
