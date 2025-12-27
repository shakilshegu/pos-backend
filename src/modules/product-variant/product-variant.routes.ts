import { Router } from 'express';
import { ProductVariantController } from './product-variant.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const productVariantController = new ProductVariantController();

/**
 * @route   POST /api/product-variants
 * @desc    Create a new product variant
 * @access  Private (ADMIN, MANAGER with MANAGE_PRODUCTS permission)
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productVariantController.create
);

/**
 * @route   GET /api/product-variants
 * @desc    Get all product variants (optionally filter by productId)
 * @access  Private (ADMIN, MANAGER with MANAGE_PRODUCTS permission)
 * @query   productId (optional)
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productVariantController.findAll
);

/**
 * @route   GET /api/product-variants/:id
 * @desc    Get product variant by ID
 * @access  Private (ADMIN, MANAGER with MANAGE_PRODUCTS permission)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productVariantController.findById
);

/**
 * @route   GET /api/product-variants/sku/:sku
 * @desc    Get product variant by SKU
 * @access  Private (ADMIN, MANAGER, CASHIER)
 */
router.get(
  '/sku/:sku',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS, Permission.CREATE_ORDER),
  productVariantController.findBySku
);

/**
 * @route   GET /api/product-variants/barcode/:barcode
 * @desc    Get product variant by barcode (for POS scanning)
 * @access  Private (ADMIN, MANAGER, CASHIER)
 */
router.get(
  '/barcode/:barcode',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS, Permission.CREATE_ORDER),
  productVariantController.findByBarcode
);

/**
 * @route   GET /api/product-variants/store/:storeId
 * @desc    Get all product variants for a store
 * @access  Private (ADMIN, MANAGER with MANAGE_PRODUCTS permission)
 */
router.get(
  '/store/:storeId',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS, Permission.CREATE_ORDER),
  productVariantController.findByStore
);

/**
 * @route   GET /api/product-variants/store/:storeId/low-stock
 * @desc    Get low stock variants for a store
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.get(
  '/store/:storeId/low-stock',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  productVariantController.findLowStock
);

/**
 * @route   PUT /api/product-variants/:id
 * @desc    Update product variant
 * @access  Private (ADMIN, MANAGER with MANAGE_PRODUCTS permission)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productVariantController.update
);

/**
 * @route   DELETE /api/product-variants/:id
 * @desc    Delete product variant
 * @access  Private (ADMIN, MANAGER with MANAGE_PRODUCTS permission)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_PRODUCTS),
  productVariantController.delete
);

export default router;
