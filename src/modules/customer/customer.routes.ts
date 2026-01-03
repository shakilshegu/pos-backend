import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const customerController = new CustomerController();

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private (ADMIN, MANAGER, CASHIER with CREATE_ORDER permission)
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.MANAGE_USERS),
  customerController.create
);

/**
 * @route   GET /api/customers
 * @desc    Get all customers (filtered by company for non-SUPER_ADMIN)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  customerController.getAll
);

/**
 * @route   GET /api/customers/search
 * @desc    Search customers by phone, name, or email
 * @access  Private (CASHIER, MANAGER, ADMIN)
 * @query   phone, name, email (optional)
 */
router.get(
  '/search',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  customerController.search
);

/**
 * @route   GET /api/customers/phone/:phone
 * @desc    Find customer by phone number (fast lookup for POS)
 * @access  Private (CASHIER, MANAGER, ADMIN)
 */
router.get(
  '/phone/:phone',
  authenticate,
  requirePermission(Permission.CREATE_ORDER),
  customerController.searchByPhone
);

/**
 * @route   GET /api/customers/company/:companyId
 * @desc    Get all customers for a specific company
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.get(
  '/company/:companyId',
  authenticate,
  requirePermission(Permission.MANAGE_USERS, Permission.VIEW_REPORTS),
  customerController.getByCompany
);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID (with order history)
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.CREATE_ORDER, Permission.VIEW_REPORTS),
  customerController.getById
);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private (ADMIN, MANAGER)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_USERS, Permission.CREATE_ORDER),
  customerController.update
);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer (only if no orders)
 * @access  Private (ADMIN, MANAGER)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_USERS),
  customerController.delete
);

export default router;
