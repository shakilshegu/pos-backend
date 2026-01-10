import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentSchema,
  RefundPaymentSchema,
  GetPaymentsQuerySchema,
  TapWebhookSchema,
} from './payment.dto';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Create a payment for an order
   *
   * @route POST /api/payments
   * @access Private (CASHIER, MANAGER, ADMIN with PROCESS_PAYMENT permission)
   */
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, companyId, storeId } = req.user!;

      // Validate request body
      const validatedData = CreatePaymentSchema.parse(req.body);

      const result = await this.paymentService.createPayment(
        validatedData,
        userId,
        companyId!,
        storeId!
      );

      if (result.requiresAction) {
        // Card/Wallet payment - return payment URL
        res.status(201).json({
          success: true,
          message: 'Payment initiated. Redirect customer to payment page.',
          data: {
            payment: result.payment,
            paymentUrl: result.paymentUrl,
            chargeId: result.chargeId,
          },
        });
      } else {
        // Cash payment - already completed
        res.status(201).json({
          success: true,
          message: 'Cash payment recorded successfully',
          data: {
            payment: result.payment,
          },
        });
      }
    } catch (error: any) {
      console.error('Create payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create payment',
      });
    }
  };

  /**
   * Get payment by ID
   *
   * @route GET /api/payments/:id
   * @access Private
   */
  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;

      const payment = await this.paymentService.getPaymentById(id, companyId!);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Get payment error:', error);
      res.status(error.message === 'Payment not found' ? 404 : 400).json({
        success: false,
        message: error.message || 'Failed to get payment',
      });
    }
  };

  /**
   * Get all payments for an order
   *
   * @route GET /api/payments/order/:orderId
   * @access Private
   */
  getByOrderId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { companyId } = req.user!;

      const result = await this.paymentService.getPaymentsByOrderId(
        orderId,
        companyId!
      );

      res.status(200).json({
        success: true,
        data: result.payments,
        summary: result.summary,
      });
    } catch (error: any) {
      console.error('Get payments by order error:', error);
      res.status(error.message === 'Order not found' ? 404 : 400).json({
        success: false,
        message: error.message || 'Failed to get payments',
      });
    }
  };

  /**
   * List payments with filters
   *
   * @route GET /api/payments
   * @access Private
   */
  getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId, storeId } = req.user!;

      // Validate query parameters
      const validatedQuery = GetPaymentsQuerySchema.parse(req.query);

      const result = await this.paymentService.getPayments(
        validatedQuery,
        companyId!,
        storeId
      );

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Get payments error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get payments',
      });
    }
  };

  /**
   * Process a refund
   *
   * @route POST /api/payments/:id/refund
   * @access Private (MANAGER, ADMIN)
   */
  refund = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, companyId } = req.user!;

      // Validate request body
      const validatedData = RefundPaymentSchema.parse(req.body);

      const result = await this.paymentService.refundPayment(
        id,
        validatedData,
        userId,
        companyId!
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.payment,
      });
    } catch (error: any) {
      console.error('Refund payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process refund',
      });
    }
  };

  /**
   * Get payment statistics
   *
   * @route GET /api/payments/statistics
   * @access Private (MANAGER, ADMIN)
   */
  getStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId, storeId } = req.user!;
      const { from, to } = req.query;

      const statistics = await this.paymentService.getPaymentStatistics(
        companyId!,
        storeId,
        from as string | undefined,
        to as string | undefined
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      console.error('Get payment statistics error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get payment statistics',
      });
    }
  };

  /**
   * Handle TAP webhook
   *
   * @route POST /api/webhooks/tap
   * @access Public (but signature verified)
   */
  handleTapWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get signature from header
      const signature = req.headers['x-tap-signature'] as string;

      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
        });
        return;
      }

      // Validate webhook payload
      const webhookData = TapWebhookSchema.parse(req.body);

      // Process webhook
      const result = await this.paymentService.handleTapWebhook(
        webhookData,
        signature
      );

      res.status(200).json({
        success: true,
        message: 'Webhook processed',
        status: result.status,
      });
    } catch (error: any) {
      console.error('TAP webhook error:', error);

      // Always return 200 to TAP to avoid retries for invalid webhooks
      res.status(200).json({
        success: false,
        message: error.message || 'Failed to process webhook',
      });
    }
  };
}
