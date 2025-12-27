import { Request, Response } from 'express';
import { ProductVariantService } from './product-variant.service';
import {
  CreateProductVariantSchema,
  UpdateProductVariantSchema,
} from './product-variant.dto';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class ProductVariantController {
  private productVariantService: ProductVariantService;

  constructor() {
    this.productVariantService = new ProductVariantService();
  }

  create = async (req: AuthRequest, res: Response) => {
    try {
      const validation = CreateProductVariantSchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const data = validation.data;

      // Get storeId from request (either from body or user's assigned store)
      const storeId = req.body.storeId || req.user?.storeId;

      if (!storeId) {
        return ApiResponse.badRequest(res, 'Store ID is required');
      }

      const variant = await this.productVariantService.create(data, storeId);
      return ApiResponse.created(res, variant, 'Product variant created successfully');
    } catch (error: any) {
      console.error('Error creating product variant:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findAll = async (req: Request, res: Response) => {
    try {
      const { productId } = req.query;
      const variants = await this.productVariantService.findAll(productId as string);
      return ApiResponse.success(res, variants);
    } catch (error: any) {
      console.error('Error fetching product variants:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const variant = await this.productVariantService.findById(id);
      return ApiResponse.success(res, variant);
    } catch (error: any) {
      console.error('Error fetching product variant:', error);
      return ApiResponse.notFound(res, error.message);
    }
  };

  findBySku = async (req: Request, res: Response) => {
    try {
      const { sku } = req.params;
      const variant = await this.productVariantService.findBySku(sku);
      return ApiResponse.success(res, variant);
    } catch (error: any) {
      console.error('Error fetching product variant by SKU:', error);
      return ApiResponse.notFound(res, error.message);
    }
  };

  findByBarcode = async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;
      const variant = await this.productVariantService.findByBarcode(barcode);
      return ApiResponse.success(res, variant);
    } catch (error: any) {
      console.error('Error fetching product variant by barcode:', error);
      return ApiResponse.notFound(res, error.message);
    }
  };

  findByStore = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const variants = await this.productVariantService.findByStore(storeId);
      return ApiResponse.success(res, variants);
    } catch (error: any) {
      console.error('Error fetching product variants by store:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findLowStock = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const variants = await this.productVariantService.findLowStock(storeId);
      return ApiResponse.success(res, variants, 'Low stock variants retrieved');
    } catch (error: any) {
      console.error('Error fetching low stock variants:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = UpdateProductVariantSchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const variant = await this.productVariantService.update(id, validation.data);
      return ApiResponse.success(res, variant, 'Product variant updated successfully');
    } catch (error: any) {
      console.error('Error updating product variant:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.productVariantService.delete(id);
      return ApiResponse.success(res, null, 'Product variant deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product variant:', error);
      return ApiResponse.error(res, error.message);
    }
  };
}
