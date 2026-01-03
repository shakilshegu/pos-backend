import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CustomerService } from './customer.service';
import { CreateCustomerSchema, UpdateCustomerSchema, SearchCustomerSchema } from './customer.dto';
import { ApiResponse } from '../../utils/response';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validation = CreateCustomerSchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const user = req.user!;
      const data = validation.data;

      // If user is not SUPER_ADMIN, use their companyId
      if (user.role !== 'SUPER_ADMIN') {
        data.companyId = user.companyId!;
      }

      const customer = await this.customerService.create(data);
      return ApiResponse.created(res, customer, 'Customer created successfully');
    } catch (error: any) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      let companyId: string | undefined;

      // If user is not SUPER_ADMIN, filter by their company
      if (user.role !== 'SUPER_ADMIN') {
        companyId = user.companyId!;
      }

      const customers = await this.customerService.findAll(companyId);
      return ApiResponse.success(res, customers, 'Customers retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const customer = await this.customerService.findById(id);

      // Check if user has access to this customer's company
      if (user.role !== 'SUPER_ADMIN' && customer.companyId !== user.companyId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      return ApiResponse.success(res, customer, 'Customer retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  searchByPhone = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.params;
      const user = req.user!;

      if (!user.companyId) {
        return ApiResponse.badRequest(res, 'User must belong to a company');
      }

      const customer = await this.customerService.findByPhone(phone, user.companyId);
      return ApiResponse.success(res, customer, 'Customer found');
    } catch (error) {
      next(error);
    }
  };

  search = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validation = SearchCustomerSchema.safeParse(req.query);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const user = req.user!;
      const params = validation.data;

      // If user is not SUPER_ADMIN, filter by their company
      if (user.role !== 'SUPER_ADMIN') {
        params.companyId = user.companyId!;
      }

      const customers = await this.customerService.search(params);
      return ApiResponse.success(res, customers, 'Search results');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Check access
      const existing = await this.customerService.findById(id);
      if (user.role !== 'SUPER_ADMIN' && existing.companyId !== user.companyId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const validation = UpdateCustomerSchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const customer = await this.customerService.update(id, validation.data);
      return ApiResponse.success(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Check access
      const existing = await this.customerService.findById(id);
      if (user.role !== 'SUPER_ADMIN' && existing.companyId !== user.companyId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      await this.customerService.delete(id);
      return ApiResponse.success(res, null, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getByCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const user = req.user!;

      // Check access
      if (user.role !== 'SUPER_ADMIN' && companyId !== user.companyId) {
        return ApiResponse.forbidden(res, 'Access denied');
      }

      const customers = await this.customerService.findByCompany(companyId);
      return ApiResponse.success(res, customers, 'Customers retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
