import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/register-with-permissions', authController.registerWithPermissions);
router.get('/profile', authenticate, authController.getProfile);

export default router;
