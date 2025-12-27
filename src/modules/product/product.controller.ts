import { Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { CreateProductSchema, UpdateProductSchema } from './product.dto';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = CreateProductSchema.parse(req.body);
      const result = await this.productService.createProduct(validatedData);
      return ApiResponse.created(res, result, 'Product created successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, 'Validation failed', error.errors);
      }
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.productService.getProductById(id);
      return ApiResponse.success(res, result, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getByStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { storeId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.productService.getProductsByStore(storeId, page, limit);
      return ApiResponse.success(res, result, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateProductSchema.parse(req.body);
      const result = await this.productService.updateProduct(id, validatedData);
      return ApiResponse.success(res, result, 'Product updated successfully');
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
      await this.productService.deleteProduct(id);
      return ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  search = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { storeId } = req.params;
      const query = req.query.q as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.productService.searchProducts(storeId, query, page, limit);
      return ApiResponse.success(res, result, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
