import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { StoreService } from './store.service';
import { CreateStoreSchema, UpdateStoreSchema } from './store.dto';
import { ApiResponse } from '../../utils/response';

export class StoreController {
  private storeService: StoreService;

  constructor() {
    this.storeService = new StoreService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = CreateStoreSchema.parse(req.body);

      // Validate user has access to the company
      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== validatedData.companyId) {
        return ApiResponse.forbidden(res, 'Cannot create store for another company');
      }

      const result = await this.storeService.create(validatedData);
      return ApiResponse.created(res, result, 'Store created successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };

  getByCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;

      // Validate user has access to the company
      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return ApiResponse.forbidden(res, 'Cannot access stores from another company');
      }

      const result = await this.storeService.getByCompany(companyId);
      return ApiResponse.success(res, result, 'Stores retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.storeService.getById(id);

      // Validate user has access to the store's company
      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== result.companyId) {
        return ApiResponse.forbidden(res, 'Cannot access store from another company');
      }

      return ApiResponse.success(res, result, 'Store retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateStoreSchema.parse(req.body);

      const store = await this.storeService.getById(id);

      // Validate user has access to the store's company
      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== store.companyId) {
        return ApiResponse.forbidden(res, 'Cannot update store from another company');
      }

      const result = await this.storeService.update(id, validatedData);
      return ApiResponse.success(res, result, 'Store updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const store = await this.storeService.getById(id);

      // Validate user has access to the store's company
      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== store.companyId) {
        return ApiResponse.forbidden(res, 'Cannot delete store from another company');
      }

      await this.storeService.delete(id);
      return ApiResponse.success(res, null, 'Store deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
