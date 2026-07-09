import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/user.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'edufin_jwt_access_secret_key_2026_secure';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'edufin_jwt_refresh_secret_key_2026_secure';

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
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

    const newUser = new User({
      email,
      passwordHash,
      name,
      role: role as UserRole,
      status: 'Active',
      refreshTokens: [],
    });

    await newUser.save();

    const { accessToken, refreshToken } = generateTokens({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    newUser.refreshTokens.push(refreshToken);
    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
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

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is inactive or pending approval' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Save refresh token to user array (supports multi-device sessions)
    user.refreshTokens.push(refreshToken);
    await user.save();

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server login error', error });
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
      // Re-use detection: if someone attempts to refresh with a token that is not found,
      // it might have been stolen and already used. We should consider invalidating all.
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
        const hackedUser = await User.findById(decoded.id);
        if (hackedUser) {
          hackedUser.refreshTokens = []; // Revoke all sessions
          await hackedUser.save();
        }
      } catch (_) {}

      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; email: string; role: string };

      // Generate new pair
      const tokens = generateTokens({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });

      // Rotate token: Remove the old one, add the new one
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err) {
      // Token expired or invalid signature
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
