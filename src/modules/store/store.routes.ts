import { Router } from 'express';
import { StoreController } from './store.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const storeController = new StoreController();

// ADMIN and SUPER_ADMIN can manage stores
// SUPER_ADMIN has MANAGE_COMPANY which allows managing stores for all companies
// ADMIN has MANAGE_STORES which allows managing stores for their company
router.post(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_STORES, Permission.MANAGE_COMPANY),
  storeController.create
);

router.get(
  '/company/:companyId',
  authenticate,
  requirePermission(Permission.MANAGE_STORES, Permission.MANAGE_COMPANY),
  storeController.getByCompany
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_STORES, Permission.MANAGE_COMPANY),
  storeController.getById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_STORES, Permission.MANAGE_COMPANY),
  storeController.update
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_STORES, Permission.MANAGE_COMPANY),
  storeController.delete
);

export default router;
