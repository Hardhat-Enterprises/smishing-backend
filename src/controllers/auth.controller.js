import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import { generateOtp, verifyOtp } from '../utils/otp.util.js';
import { hashPassword, comparePassword, generateToken } from '../utils/token.util.js';
import { sendEmail } from '../services/email.service.js';

/**
 * POST /api/auth/signup
 */
export const signup = async (req, res, next) => {
  // check express-validator errors (if you're using it in your route)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullName, phoneNumber, email, password } = req.body;
    if (!fullName || !phoneNumber || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, phoneNumber, email, password) are required.',
      });
    }

    // prevent duplicate registration
    if (await User.exists({ email })) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use.',
      });
    }

    // basic email format check
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    // hash & create
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      fullName,
      phoneNumber,
      email,
      passwordHash,
      isEmailVerified: false,
    });

    // send OTP for email verification
    const otpCode = await generateOtp(user._id, 'signup');
    await sendEmail(email, `Your verification OTP is: ${otpCode}. It will expire in 10 minutes.`);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP required.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const result = await verifyOtp(user._id, 'signup', otp);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        attemptsLeft: result.attemptsLeft,
        lockoutUntil: result.lockoutUntil,
        message: result.message || 'Invalid OTP.',
      });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  // express-validator check, if used:
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // basic email format check
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    const token = generateToken({ userId: user._id });
    return res.json({
      success: true,
      message: 'Login successful.',
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const otpCode = await generateOtp(user._id, 'resetpassword');
    await sendEmail(email, `Your OTP to reset your password is: ${otpCode}. It will expire in 10 minutes.`);

    return res.json({
      success: true,
      message: 'OTP sent to email for password reset.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, otp } = req.body;
    if (!email || !newPassword || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email, new password, and OTP are required.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const result = await verifyOtp(user._id, 'resetpassword', otp);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        attemptsLeft: result.attemptsLeft,
        lockoutUntil: result.lockoutUntil,
        message: result.message || 'Invalid or expired OTP.',
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};
