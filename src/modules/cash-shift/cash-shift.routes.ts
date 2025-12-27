import { Router } from 'express';
import { CashShiftController } from './cash-shift.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const cashShiftController = new CashShiftController();

/**
 * @route   POST /api/shifts/open
 * @desc    Open a new cash shift
 * @access  Private (CASHIER, MANAGER with CREATE_ORDER permission)
 * @body    { openingCash: number, openingNotes?: string }
 */
router.post(
  '/open',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  cashShiftController.openShift
);

/**
 * @route   POST /api/shifts/close
 * @desc    Close current active shift
 * @access  Private (CASHIER, MANAGER with CREATE_ORDER permission)
 * @body    { closingCash: number, closingNotes?: string }
 */
router.post(
  '/close',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  cashShiftController.closeShift
);

/**
 * @route   GET /api/shifts/current
 * @desc    Get current active shift for logged-in user
 * @access  Private (CASHIER, MANAGER with CREATE_ORDER permission)
 */
router.get(
  '/current',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  cashShiftController.getCurrentShift
);

/**
 * @route   GET /api/shifts
 * @desc    Get shifts with filters (role-based access)
 * @access  Private (CASHIER: own shifts, MANAGER: store shifts, ADMIN: company shifts, SUPER_ADMIN: all)
 * @query   status, userId, storeId, from, to
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  cashShiftController.getShifts
);

/**
 * @route   GET /api/shifts/:id
 * @desc    Get shift by ID
 * @access  Private (Owner, Manager of store, Admin of company, Super Admin)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  cashShiftController.getShiftById
);

/**
 * @route   GET /api/shifts/:id/summary
 * @desc    Get detailed shift summary with payment breakdown
 * @access  Private (Owner, Manager of store, Admin of company, Super Admin)
 */
router.get(
  '/:id/summary',
  authenticate,
  requirePermission(Permission.VIEW_REPORTS),
  cashShiftController.getShiftSummary
);

export default router;
