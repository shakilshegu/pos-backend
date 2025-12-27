import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const inventoryController = new InventoryController();

/**
 * @route   POST /api/inventory
 * @desc    Create inventory record
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.create
);

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory (optionally filter by storeId)
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 * @query   storeId (optional)
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.findAll
);

/**
 * @route   GET /api/inventory/:id
 * @desc    Get inventory by ID
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.findById
);

/**
 * @route   GET /api/inventory/variant/:productVariantId/store/:storeId
 * @desc    Get inventory for specific variant and store
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.get(
  '/variant/:productVariantId/store/:storeId',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK, Permission.CREATE_ORDER),
  inventoryController.findByVariantAndStore
);

/**
 * @route   GET /api/inventory/store/:storeId/low-stock
 * @desc    Get low stock items for a store
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.get(
  '/store/:storeId/low-stock',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.findLowStock
);

/**
 * @route   GET /api/inventory/store/:storeId/out-of-stock
 * @desc    Get out of stock items for a store
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.get(
  '/store/:storeId/out-of-stock',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.findOutOfStock
);

/**
 * @route   GET /api/inventory/product/:productId
 * @desc    Get inventory for all variants of a product
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.get(
  '/product/:productId',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.findByProduct
);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.update
);

/**
 * @route   PATCH /api/inventory/:id/adjust
 * @desc    Adjust inventory quantity (add or remove)
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.patch(
  '/:id/adjust',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.adjustQuantity
);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete inventory
 * @access  Private (ADMIN, MANAGER with MANAGE_STOCK permission)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_STOCK),
  inventoryController.delete
);

export default router;
