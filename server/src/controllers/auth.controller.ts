import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole } from '../models/user.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mail.service';
import { uploadToCloudinary } from '../services/upload.service';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'edufin_jwt_access_secret_key_2026_secure';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'edufin_jwt_refresh_secret_key_2026_secure';

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      email,
      passwordHash,
      name,
      role: role as UserRole,
      status: 'Active',
      refreshTokens: [],
      isEmailVerified: false,
      emailVerificationToken: verificationCode,
      emailVerificationExpiry: verificationExpiry,
      loginAttempts: 0
    });

    await newUser.save();
    
    // Dispatch Verification Email
    await sendVerificationEmail(newUser.email, newUser.name, verificationCode);

    return res.status(201).json({
      message: 'Account created successfully. A verification code has been dispatched to your email.',
      email: newUser.email,
      isVerified: false
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server registration error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 1. Lockout Check
    if (user.isLocked()) {
      const secondsLeft = Math.ceil(((user.lockUntil?.getTime() || 0) - Date.now()) / 1000);
      const minutesLeft = Math.ceil(secondsLeft / 60);
      return res.status(423).json({
        message: `Account is temporarily locked. Please try again in ${minutesLeft} minute(s).`
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is inactive or pending approval' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      // Increment failed login counter
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
        await user.save();
        return res.status(423).json({
          message: 'Too many failed login attempts. Your account is locked for 15 minutes.'
        });
      }

      await user.save();
      const attemptsRemaining = 5 - user.loginAttempts;
      return res.status(401).json({
        message: `Invalid email or password. You have ${attemptsRemaining} attempt(s) remaining before lockout.`
      });
    }

    // Check if email is verified (bypassed for sandbox demo accounts ending in @edufin.edu)
    const isSandboxAccount = user.email.endsWith('@edufin.edu');
    if (!user.isEmailVerified && !isSandboxAccount) {
      return res.status(403).json({
        message: 'Your email address is not verified yet.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Login successful: Reset lockout attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const { accessToken, refreshToken } = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.refreshTokens.push(refreshToken);
    await user.save();

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server login error', error });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    const user = await User.findOne({
      email,
      emailVerificationToken: code,
      emailVerificationExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    // Log in instantly post verification
    const { accessToken, refreshToken } = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    user.refreshTokens.push(refreshToken);
    await user.save();

    return res.json({
      message: 'Email verified successfully. Welcome onboard!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: true
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    return res.status(500).json({ message: 'Verification transaction error', error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak details if user doesn't exist for security reasons, return a generic success
      return res.json({ message: 'If this account is registered, a password recovery code has been sent.' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return res.json({
      message: 'A password recovery code has been sent to your registered campus email.',
      email: user.email
    });
  } catch (error) {
    return res.status(500).json({ message: 'Forgot password routing error', error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, recovery code, and new password are required' });
  }

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired recovery code' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Clear recovery tokens and lock counters
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    return res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: 'Reset password transaction error', error });
  }
};

export const logoutAll = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshTokens = []; // Clear all active tokens
      await user.save();
    }
    return res.json({ message: 'Successfully logged out from all active sessions' });
  } catch (error) {
    return res.status(500).json({ message: 'Server sessions clearance error', error });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { name, phoneNumber, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional Password Change validation
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password provided is incorrect' });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    // Name and phone number updates
    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    // Avatar file upload check (using multer buffer)
    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer);
      user.avatar = avatarUrl;
    }

    await user.save();

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating user profile', error });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) {
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
        const hackedUser = await User.findById(decoded.id);
        if (hackedUser) {
          hackedUser.refreshTokens = [];
          await hackedUser.save();
        }
      } catch (_) {}

      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; email: string; role: string };

      const tokens = generateTokens({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });

      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save();
      return res.status(403).json({ message: 'Expired refresh token', error: err });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Token refresh error', error });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      const user = await User.findOne({ refreshTokens: refreshToken });
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save();
      }
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server logout error', error });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving profile', error });
  }
};
