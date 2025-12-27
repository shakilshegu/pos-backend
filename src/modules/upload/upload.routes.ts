import { Router } from 'express';
import { uploadController } from './upload.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requirePermissions } from '@/middlewares/permission.middleware';

const router = Router();

/**
 * @route   POST /api/uploads/presigned-url
 * @desc    Generate pre-signed S3 URL for image upload
 * @access  Private (ADMIN, MANAGER)
 */
router.post(
  '/presigned-url',
  authenticate,
  requirePermissions(['MANAGE_PRODUCTS', 'MANAGE_COMPANY']),
  uploadController.generatePresignedUrl
);

export default router;
