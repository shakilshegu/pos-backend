import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiResponse } from '../utils/response';

/**
 * Permission-based authorization middleware
 * Use this to protect routes based on user permissions
 *
 * @param requiredPermissions - Array of permissions required to access the route
 * @returns Middleware function
 *
 * @example
 * router.post('/products', authenticate, requirePermissions(['MANAGE_PRODUCTS']), createProduct);
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const userPermissions = req.user.permissions || [];

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission =>
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
      return ApiResponse.error(res, 'Authorization error');
    }
  };
};

/**
 * Requires ALL specified permissions (AND logic)
 *
 * @param requiredPermissions - Array of permissions that user MUST have all of
 * @returns Middleware function
 *
 * @example
 * router.post('/critical-operation', authenticate, requireAllPermissions(['MANAGE_COMPANY', 'MANAGE_USERS']), handler);
 */
export const requireAllPermissions = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      const userPermissions = req.user.permissions || [];

      // Check if user has ALL required permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return ApiResponse.forbidden(
          res,
          'You do not have all the required permissions to access this resource'
        );
      }

      next();
    } catch (error) {
      return ApiResponse.error(res, 'Authorization error');
    }
  };
};

/**
 * Simplified permission check that accepts permissions as arguments (OR logic)
 * Convenience wrapper around requirePermissions for better readability
 *
 * @param permissions - One or more permissions (at least one required)
 * @returns Middleware function
 *
 * @example
 * router.post('/products', authenticate, requirePermission(Permission.MANAGE_PRODUCTS), createProduct);
 * router.get('/stores', authenticate, requirePermission(Permission.MANAGE_STORES, Permission.MANAGE_COMPANY), getStores);
 */
export const requirePermission = (...permissions: string[]) => {
  return requirePermissions(permissions);
};

/**
 * Role-based authorization middleware (for backward compatibility)
 * Note: Prefer permission-based checks for better granularity
 *
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns Middleware function
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        return ApiResponse.forbidden(
          res,
          'You do not have the required role to access this resource'
        );
      }

      next();
    } catch (error) {
      return ApiResponse.error(res, 'Authorization error');
    }
  };
};
