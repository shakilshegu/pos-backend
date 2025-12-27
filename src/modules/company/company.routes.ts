import { Router } from 'express';
import { CompanyController } from './company.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';
import { Permission } from '@prisma/client';

const router = Router();
const companyController = new CompanyController();

// Only SUPER_ADMIN can manage companies
router.post(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANY),
  companyController.create
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANY),
  companyController.getAll
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANY),
  companyController.getById
);

router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANY),
  companyController.update
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANY),
  companyController.delete
);

export default router;
