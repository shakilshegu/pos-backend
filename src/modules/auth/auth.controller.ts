import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginSchema, RegisterSchema } from './auth.dto';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await this.authService.login(validatedData);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = RegisterSchema.parse(req.body);
      const result = await this.authService.register(validatedData);
      return ApiResponse.created(res, result, 'User registered successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await this.authService.getProfile(userId);
      return ApiResponse.success(res, result, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register user with automatic permission assignment
   * Automatically assigns permissions based on the role
   */
  registerWithPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = RegisterSchema.parse(req.body);
      const result = await this.authService.registerWithPermissions(validatedData);
      return ApiResponse.created(res, result, 'User registered successfully with permissions');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };
}
