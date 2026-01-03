import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const orderController = new OrderController();

/**
 * @route   POST /api/orders
 * @desc    Create a new order (DRAFT status)
 * @access  Private (CREATE_ORDER permission)
 * @body    { customerType?: string, customerName?: string, customerPhone?: string, notes?: string }
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get orders with filters (role-based access)
 * @access  Private (CREATE_ORDER or VIEW_REPORTS permission)
 * @query   status, customerType, cashierId, storeId, shiftId, from, to, page, limit
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  orderController.getOrders
);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order by ID
 * @access  Private (Owner, Manager of store, Admin of company, Super Admin)
 */
router.get(
  '/:orderId',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  orderController.getOrderById
);

/**
 * @route   PATCH /api/orders/:orderId
 * @desc    Update order details (only DRAFT orders)
 * @access  Private (CREATE_ORDER permission, order owner)
 * @body    { customerType?: string, customerName?: string, customerPhone?: string, notes?: string }
 */
router.patch(
  '/:orderId',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.updateOrder
);

/**
 * @route   POST /api/orders/:orderId/items
 * @desc    Add item to order
 * @access  Private (CREATE_ORDER permission, order owner)
 * @body    { productVariantId: string, quantity: number, discountAmount?: number }
 */
router.post(
  '/:orderId/items',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.addItemToOrder
);

/**
 * @route   POST /api/orders/:orderId/items/barcode
 * @desc    Add item to order by scanning barcode (POS)
 * @access  Private (CREATE_ORDER permission, order owner)
 * @body    { barcode: string, quantity?: number, discountAmount?: number }
 */
router.post(
  '/:orderId/items/barcode',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.addItemByBarcode
);

/**
 * @route   PATCH /api/orders/:orderId/items/:itemId
 * @desc    Update order item
 * @access  Private (CREATE_ORDER permission, order owner)
 * @body    { quantity?: number, discountAmount?: number }
 */
router.patch(
  '/:orderId/items/:itemId',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.updateOrderItem
);

/**
 * @route   DELETE /api/orders/:orderId/items/:itemId
 * @desc    Remove item from order
 * @access  Private (CREATE_ORDER permission, order owner)
 */
router.delete(
  '/:orderId/items/:itemId',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.removeOrderItem
);

/**
 * @route   POST /api/orders/:orderId/confirm
 * @desc    Confirm order (DRAFT → PENDING)
 * @access  Private (CREATE_ORDER permission, order owner)
 */
router.post(
  '/:orderId/confirm',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.confirmOrder
);

/**
 * @route   POST /api/orders/:orderId/cancel
 * @desc    Cancel order
 * @access  Private (CREATE_ORDER permission, order owner or manager)
 * @body    { cancelReason: string }
 */
router.post(
  '/:orderId/cancel',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.cancelOrder
);

/**
 * @route   POST /api/orders/return
 * @desc    Create return bill for product returns
 * @access  Private (CREATE_ORDER permission)
 * @body    { originalOrderId: string, returnReason: string, items: [{ orderItemId: string, quantity: number }], notes?: string }
 */
router.post(
  '/return',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  orderController.createReturnBill
);

/**
 * @route   POST /api/orders/:orderId/void
 * @desc    Void order (same-day only, manager approval required)
 * @access  Private (MANAGER, ADMIN, SUPER_ADMIN roles)
 * @body    { voidReason: string }
 */
router.post(
  '/:orderId/void',
  authenticate,
  requirePermission(Permission.MANAGE_USERS), // Managers and admins
  orderController.voidOrder
);

export default router;
