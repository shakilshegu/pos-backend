import {
  PaymentMethod,
  PaymentStatus,
  PaymentProvider,
  OrderStatus,
  OrderType,
  PrismaClient,
} from '@prisma/client';
import { PaymentRepository } from './payment.repository';
import { TapGatewayAdapter } from './tap-gateway.adapter';
import { CreatePaymentDto, RefundPaymentDto, GetPaymentsQueryDto } from './payment.dto';
import { CashShiftService } from '../cash-shift/cash-shift.service';
import { OrderService } from '../order/order.service';

const prisma = new PrismaClient();

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private tapGateway: TapGatewayAdapter;
  private cashShiftService: CashShiftService;
  private orderService: OrderService;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.tapGateway = new TapGatewayAdapter();
    this.cashShiftService = new CashShiftService();
    this.orderService = new OrderService();
  }

  /**
   * Create a payment for an order
   *
   * Flow:
   * 1. Validate order status (must be PENDING)
   * 2. Validate payment amount
   * 3. Create payment record with INITIATED status
   * 4. If CASH → mark SUCCESS immediately
   * 5. If CARD/WALLET → create TAP charge and return payment URL
   */
  async createPayment(
    data: CreatePaymentDto,
    userId: string,
    companyId: string,
    storeId: string
  ) {
    // 1. Get and validate order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        payments: {
          where: {
            status: PaymentStatus.SUCCESS,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify order belongs to user's company and store
    if (order.companyId !== companyId || order.storeId !== storeId) {
      throw new Error('Access denied: Order does not belong to your company/store');
    }

    // Only PENDING orders can be paid
    if (order.status !== OrderStatus.PENDING) {
      throw new Error(
        `Cannot process payment for order with status: ${order.status}. Order must be in PENDING status.`
      );
    }

    // 2. Validate payment amount
    if (data.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    // Calculate remaining amount to pay
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const remainingAmount = Number(order.totalAmount) - totalPaid;

    if (remainingAmount <= 0) {
      throw new Error('Order is already fully paid');
    }

    if (data.amount > remainingAmount) {
      throw new Error(
        `Payment amount (${data.amount}) exceeds remaining balance (${remainingAmount})`
      );
    }

    // 3. Determine provider based on method
    const provider =
      data.method === PaymentMethod.CASH
        ? PaymentProvider.INTERNAL
        : PaymentProvider.TAP;

    // 4. Validate cash shift for CASH payments
    let shiftId: string | undefined;
    if (data.method === PaymentMethod.CASH) {
      // CASH payments require an open shift
      shiftId = await this.cashShiftService.validateCashPayment(userId, storeId);
    }

    // 5. Create payment record
    const payment = await this.paymentRepository.create({
      amount: data.amount,
      currency: 'BHD',
      method: data.method,
      status: PaymentStatus.INITIATED,
      provider,
      customerRef: data.customerRef,
      notes: data.notes,
      shiftId, // Link to cash shift if CASH payment
      order: {
        connect: { id: data.orderId },
      },
      processedByUser: {
        connect: { id: userId },
      },
      companyId,
      storeId,
    });

    // 6. Handle based on payment method
    if (data.method === PaymentMethod.CASH) {
      // CASH: Mark as SUCCESS immediately
      await this.markPaymentSuccess(payment.id, null, {
        method: 'CASH',
        processedBy: userId,
        timestamp: new Date().toISOString(),
      });

      return {
        payment: await this.paymentRepository.findById(payment.id),
        requiresAction: false,
      };
    } else {
      // CARD/WALLET: Create TAP charge
      try {
        const customerPhone = data.customerRef || order.customerPhone || '00000000';
        const redirectUrl = process.env.TAP_REDIRECT_URL || 'https://yourapp.com/payment/callback';
        const webhookUrl = process.env.TAP_WEBHOOK_URL || 'https://yourapp.com/api/webhooks/tap';

        const tapCharge = await this.tapGateway.createCharge(
          data.amount,
          'BHD',
          payment.id,
          order.id,
          customerPhone,
          redirectUrl,
          webhookUrl
        );

        // Update payment with TAP charge ID and data
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            providerRef: tapCharge.id,
            providerData: tapCharge as any,
          },
        });

        return {
          payment: await this.paymentRepository.findById(payment.id),
          requiresAction: true,
          paymentUrl: this.tapGateway.getPaymentUrl(tapCharge),
          chargeId: tapCharge.id,
        };
      } catch (error: any) {
        // Mark payment as FAILED
        await this.paymentRepository.updateStatus(
          payment.id,
          PaymentStatus.FAILED,
          error.message
        );

        throw new Error(`Failed to create TAP payment: ${error.message}`);
      }
    }
  }

  /**
   * Mark payment as successful and update order status
   */
  private async markPaymentSuccess(
    paymentId: string,
    providerRef?: string | null,
    providerData?: any
  ) {
    // Update payment status
    await this.paymentRepository.updateStatus(
      paymentId,
      PaymentStatus.SUCCESS,
      undefined,
      providerData
    );

    // Get payment to access order
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if order is now fully paid
    await this.checkAndUpdateOrderStatus(payment.orderId);
  }

  /**
   * Check total paid amount and update order status if fully paid
   */
  private async checkAndUpdateOrderStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: {
            status: PaymentStatus.SUCCESS,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Calculate total paid
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // If fully paid, update order status to PAID and handle inventory
    if (totalPaid >= Math.abs(Number(order.totalAmount))) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });

      // Handle inventory based on order type
      if (order.type === OrderType.SALE) {
        // SALE: Deduct inventory (TODO: implement inventory deduction)
        console.log(`Order ${order.orderNumber} (SALE) marked as PAID. Inventory deduction pending.`);
      } else if (order.type === OrderType.RETURN || order.type === OrderType.VOID) {
        // RETURN/VOID: Restore inventory
        await this.orderService.restoreInventoryForReturn(orderId);
        console.log(`Order ${order.orderNumber} (${order.type}) marked as PAID. Inventory restored.`);
      }
    }
  }

  /**
   * Handle TAP webhook
   *
   * This is called when TAP sends payment status updates
   */
  async handleTapWebhook(webhookPayload: any, signature: string) {
    // Verify webhook signature
    const isValid = this.tapGateway.verifyWebhookSignature(
      JSON.stringify(webhookPayload),
      signature
    );

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Extract data from webhook
    const chargeId = webhookPayload.id;
    const tapStatus = webhookPayload.status;
    const paymentId = webhookPayload.reference?.order; // Our payment ID

    if (!paymentId) {
      console.error('Webhook missing payment reference:', webhookPayload);
      throw new Error('Invalid webhook: missing payment reference');
    }

    // Find payment by our ID or TAP charge ID
    let payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      payment = await this.paymentRepository.findByProviderRef(chargeId);
    }

    if (!payment) {
      console.error('Payment not found for webhook:', { paymentId, chargeId });
      throw new Error('Payment not found');
    }

    // Map TAP status to our status
    const newStatus = this.tapGateway.mapTapStatus(tapStatus);

    // Update payment status
    if (newStatus === 'SUCCESS') {
      await this.markPaymentSuccess(payment.id, chargeId, webhookPayload);
    } else if (newStatus === 'FAILED') {
      const failureReason =
        webhookPayload.response?.message || 'Payment failed';

      await this.paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.FAILED,
        failureReason,
        webhookPayload
      );
    } else {
      // INITIATED or other status
      await this.paymentRepository.updateStatus(
        payment.id,
        newStatus as PaymentStatus,
        undefined,
        webhookPayload
      );
    }

    return { success: true, status: newStatus };
  }

  /**
   * Process a refund
   *
   * Flow:
   * 1. Validate payment is SUCCESS status
   * 2. If CASH → mark as REFUNDED (manual cash refund)
   * 3. If CARD/WALLET → create TAP refund
   */
  async refundPayment(
    paymentId: string,
    data: RefundPaymentDto,
    userId: string,
    companyId: string
  ) {
    // Get payment
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify access
    if (payment.companyId !== companyId) {
      throw new Error('Access denied');
    }

    // Validate payment status
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new Error('Only successful payments can be refunded');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('Payment is already refunded');
    }

    // Determine refund amount
    const refundAmount = data.amount || Number(payment.amount);

    if (refundAmount > Number(payment.amount)) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Process refund based on method
    if (payment.method === PaymentMethod.CASH) {
      // CASH: Mark as refunded (manual process)
      await this.paymentRepository.markAsRefunded(
        paymentId,
        userId,
        data.refundReason
      );

      return {
        success: true,
        message: 'Cash refund recorded. Please return cash to customer.',
        payment: await this.paymentRepository.findById(paymentId),
      };
    } else {
      // CARD/WALLET: Create TAP refund
      if (!payment.providerRef) {
        throw new Error('Payment has no provider reference for refund');
      }

      try {
        const tapRefund = await this.tapGateway.createRefund(
          payment.providerRef,
          refundAmount,
          payment.currency,
          data.refundReason,
          paymentId
        );

        // Mark as refunded
        await this.paymentRepository.markAsRefunded(
          paymentId,
          userId,
          data.refundReason
        );

        // Update order status back to PENDING if needed
        if (payment.order.status === OrderStatus.PAID) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.PENDING },
          });
        }

        return {
          success: true,
          message: 'Refund processed successfully',
          payment: await this.paymentRepository.findById(paymentId),
          refund: tapRefund,
        };
      } catch (error: any) {
        throw new Error(`Failed to process TAP refund: ${error.message}`);
      }
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string, companyId: string) {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify access
    if (payment.companyId !== companyId) {
      throw new Error('Access denied');
    }

    return payment;
  }

  /**
   * Get all payments for an order
   */
  async getPaymentsByOrderId(orderId: string, companyId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify access
    if (order.companyId !== companyId) {
      throw new Error('Access denied');
    }

    const payments = await this.paymentRepository.findByOrderId(orderId);

    // Calculate totals
    const totalPaid = await this.paymentRepository.getTotalPaidForOrder(orderId);
    const remainingAmount = Number(order.totalAmount) - totalPaid;

    return {
      payments,
      summary: {
        orderTotal: Number(order.totalAmount),
        totalPaid,
        remainingAmount,
        fullyPaid: remainingAmount <= 0,
      },
    };
  }

  /**
   * List payments with filters and pagination
   */
  async getPayments(query: GetPaymentsQueryDto, companyId: string, storeId?: string) {
    const filters = {
      companyId,
      storeId: query.storeId || storeId,
      orderId: query.orderId,
      method: query.method,
      status: query.status,
      provider: query.provider,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };

    const { payments, total } = await this.paymentRepository.findMany(
      filters,
      {
        page: query.page,
        limit: query.limit,
      }
    );

    return {
      payments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(
    companyId: string,
    storeId?: string,
    from?: string,
    to?: string
  ) {
    return await this.paymentRepository.getStatistics(
      companyId,
      storeId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
  }
}
