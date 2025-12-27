import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CompanyService } from './company.service';
import { CreateCompanySchema, UpdateCompanySchema } from './company.dto';
import { ApiResponse } from '../../utils/response';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = CreateCompanySchema.parse(req.body);
      const result = await this.companyService.create(validatedData);
      return ApiResponse.created(res, result, 'Company created successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.companyService.getAll();
      return ApiResponse.success(res, result, 'Companies retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.companyService.getById(id);
      return ApiResponse.success(res, result, 'Company retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateCompanySchema.parse(req.body);
      const result = await this.companyService.update(id, validatedData);
      return ApiResponse.success(res, result, 'Company updated successfully');
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
      await this.companyService.delete(id);
      return ApiResponse.success(res, null, 'Company deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
