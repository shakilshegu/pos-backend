import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { JwtUtil } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    companyId?: string;  // Optional for SUPER_ADMIN
    storeId?: string;
    permissions: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JwtUtil.verify(token);
      req.user = decoded;
      next();
    } catch (error) {
      return ApiResponse.unauthorized(res, 'Invalid or expired token');
    }
  } catch (error) {
    return ApiResponse.error(res, 'Authentication error');
  }
};
