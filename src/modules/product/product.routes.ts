import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const productController = new ProductController();

// Create product - Requires MANAGE_PRODUCTS permission
router.post(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productController.create
);

// Get product by ID - Requires MANAGE_PRODUCTS permission
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productController.getById
);

// Get products by store - Requires MANAGE_PRODUCTS permission
router.get(
  '/store/:storeId',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productController.getByStore
);

// Search products - Requires MANAGE_PRODUCTS permission
router.get(
  '/store/:storeId/search',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productController.search
);

// Update product - Requires MANAGE_PRODUCTS permission
router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productController.update
);

// Delete product - Requires MANAGE_PRODUCTS permission
router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productController.delete
);

export default router;
