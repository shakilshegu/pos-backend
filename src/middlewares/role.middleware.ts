import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiResponse } from '../utils/response';
import { Permission, Role } from '@prisma/client';

/**
 * Role-based authorization middleware
 * @deprecated Use permission-based middleware instead for better granularity
 */
export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'User not authenticated');
    }

    if (!roles.includes(req.user.role as Role)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Permission-based authorization middleware (Optimized - uses JWT permissions)
 * Checks if user has at least ONE of the required permissions (OR logic)
 *
 * @param permissions - Array of permissions, user needs at least one
 */
export const requirePermission = (...permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'User not authenticated');
      }

      const userPermissions = req.user.permissions || [];

      // Check if user has at least one of the required permissions
      const hasPermission = permissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return ApiResponse.forbidden(
          res,
          'You do not have the required permissions to access this resource'
        );
      }

      next();
    } catch (error) {
      return ApiResponse.error(res, 'Permission check failed');
    }
  };
};
