import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import {
  CreateInventorySchema,
  UpdateInventorySchema,
  AdjustInventorySchema,
} from './inventory.dto';
import { ApiResponse } from '../../utils/response';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  create = async (req: Request, res: Response) => {
    try {
      const validation = CreateInventorySchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const inventory = await this.inventoryService.create(validation.data);
      return ApiResponse.created(res, inventory, 'Inventory created successfully');
    } catch (error: any) {
      console.error('Error creating inventory:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findAll = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.query;
      const inventory = await this.inventoryService.findAll(storeId as string);
      return ApiResponse.success(res, inventory);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const inventory = await this.inventoryService.findById(id);
      return ApiResponse.success(res, inventory);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      return ApiResponse.notFound(res, error.message);
    }
  };

  findByVariantAndStore = async (req: Request, res: Response) => {
    try {
      const { productVariantId, storeId } = req.params;
      const inventory = await this.inventoryService.findByVariantAndStore(productVariantId, storeId);
      return ApiResponse.success(res, inventory);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      return ApiResponse.notFound(res, error.message);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = UpdateInventorySchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const inventory = await this.inventoryService.update(id, validation.data);
      return ApiResponse.success(res, inventory, 'Inventory updated successfully');
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  adjustQuantity = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = AdjustInventorySchema.safeParse(req.body);

      if (!validation.success) {
        return ApiResponse.badRequest(res, 'Validation failed', validation.error.issues);
      }

      const inventory = await this.inventoryService.adjustQuantity(id, validation.data);
      return ApiResponse.success(res, inventory, 'Inventory adjusted successfully');
    } catch (error: any) {
      console.error('Error adjusting inventory:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.inventoryService.delete(id);
      return ApiResponse.success(res, null, 'Inventory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting inventory:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findLowStock = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const inventory = await this.inventoryService.findLowStock(storeId);
      return ApiResponse.success(res, inventory, 'Low stock items retrieved');
    } catch (error: any) {
      console.error('Error fetching low stock items:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findOutOfStock = async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const inventory = await this.inventoryService.findOutOfStock(storeId);
      return ApiResponse.success(res, inventory, 'Out of stock items retrieved');
    } catch (error: any) {
      console.error('Error fetching out of stock items:', error);
      return ApiResponse.error(res, error.message);
    }
  };

  findByProduct = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const inventory = await this.inventoryService.findByProduct(productId);
      return ApiResponse.success(res, inventory);
    } catch (error: any) {
      console.error('Error fetching inventory by product:', error);
      return ApiResponse.error(res, error.message);
    }
  };
}
