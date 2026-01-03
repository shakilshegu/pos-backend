import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/payments
 * @desc    Create a payment for an order
 * @access  Private (CASHIER, MANAGER, ADMIN with PROCESS_PAYMENT permission)
 * @body    { orderId: string, method: PaymentMethod, amount: number, customerRef?: string, notes?: string }
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT),
  paymentController.create
);

/**
 * @route   GET /api/payments/statistics
 * @desc    Get payment statistics
 * @access  Private (MANAGER, ADMIN with VIEW_REPORTS permission)
 * @query   from?: datetime, to?: datetime
 */
router.get(
  '/statistics',
  authenticate,
  requirePermission(Permission.VIEW_REPORTS),
  paymentController.getStatistics
);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get all payments for an order
 * @access  Private
 */
router.get(
  '/order/:orderId',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT, Permission.VIEW_REPORTS),
  paymentController.getByOrderId
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT, Permission.VIEW_REPORTS),
  paymentController.getById
);

/**
 * @route   GET /api/payments
 * @desc    List payments with filters
 * @access  Private
 * @query   orderId?, method?, status?, provider?, storeId?, from?, to?, page?, limit?
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_REPORTS),
  paymentController.getAll
);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process a refund for a payment
 * @access  Private (MANAGER, ADMIN with PROCESS_PAYMENT permission)
 * @body    { refundReason: string, amount?: number }
 */
router.post(
  '/:id/refund',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT, Permission.MANAGE_USERS),
  paymentController.refund
);

export default router;
