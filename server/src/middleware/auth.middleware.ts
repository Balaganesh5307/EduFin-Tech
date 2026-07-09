import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SuperAdmin' | 'Admin' | 'Faculty' | 'Parent' | 'Student';
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_ACCESS_SECRET || 'edufin_jwt_access_secret_key_2026_secure';

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: 'SuperAdmin' | 'Admin' | 'Faculty' | 'Parent' | 'Student';
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token is expired or invalid', error });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};
