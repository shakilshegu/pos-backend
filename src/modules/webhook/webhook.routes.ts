import { Router } from 'express';
import { PaymentController } from '../payment/payment.controller';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/webhooks/tap
 * @desc    Handle TAP payment webhook
 * @access  Public (signature verified in controller)
 * @headers x-tap-signature: string
 * @body    TAP webhook payload
 */
router.post('/tap', paymentController.handleTapWebhook);

export default router;
