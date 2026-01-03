import { PrismaClient, Payment, PaymentStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentRepository {
  /**
   * Create a new payment record
   */
  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return await prisma.payment.create({
      data,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
          },
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<Payment | null> {
    return await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            companyId: true,
            storeId: true,
          },
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find payment by provider reference (TAP charge ID)
   */
  async findByProviderRef(providerRef: string): Promise<Payment | null> {
    return await prisma.payment.findUnique({
      where: { providerRef },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            companyId: true,
            storeId: true,
          },
        },
      },
    });
  }

  /**
   * Get all payments for an order
   */
  async findByOrderId(orderId: string): Promise<Payment[]> {
    return await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all successful payments for an order
   */
  async findSuccessfulByOrderId(orderId: string): Promise<Payment[]> {
    return await prisma.payment.findMany({
      where: {
        orderId,
        status: PaymentStatus.SUCCESS,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update payment status
   */
  async updateStatus(
    id: string,
    status: PaymentStatus,
    failureReason?: string,
    providerData?: any
  ): Promise<Payment> {
    return await prisma.payment.update({
      where: { id },
      data: {
        status,
        failureReason,
        providerData: providerData ? providerData : undefined,
        updatedAt: new Date(),
      },
      include: {
        order: true,
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Mark payment as refunded
   */
  async markAsRefunded(
    id: string,
    refundedBy: string,
    refundReason: string
  ): Promise<Payment> {
    return await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundedBy,
        refundReason,
        updatedAt: new Date(),
      },
      include: {
        order: true,
      },
    });
  }

  /**
   * Get payments with filters and pagination
   */
  async findMany(
    filters: {
      companyId?: string;
      storeId?: string;
      orderId?: string;
      method?: string;
      status?: PaymentStatus;
      provider?: string;
      from?: Date;
      to?: Date;
    },
    pagination: {
      page: number;
      limit: number;
    }
  ): Promise<{ payments: Payment[]; total: number }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      companyId: filters.companyId,
      storeId: filters.storeId,
      orderId: filters.orderId,
      method: filters.method as any,
      status: filters.status,
      provider: filters.provider as any,
      createdAt: {
        gte: filters.from,
        lte: filters.to,
      },
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          processedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  /**
   * Calculate total paid amount for an order
   */
  async getTotalPaidForOrder(orderId: string): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        orderId,
        status: PaymentStatus.SUCCESS,
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Get payment statistics for a store/company
   */
  async getStatistics(
    companyId: string,
    storeId?: string,
    from?: Date,
    to?: Date
  ): Promise<{
    totalAmount: number;
    totalPayments: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
  }> {
    const where: Prisma.PaymentWhereInput = {
      companyId,
      storeId,
      createdAt: {
        gte: from,
        lte: to,
      },
    };

    const [aggregate, payments] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          ...where,
          status: PaymentStatus.SUCCESS,
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      prisma.payment.findMany({
        where,
        select: {
          method: true,
          status: true,
          amount: true,
        },
      }),
    ]);

    // Group by method
    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};

    payments.forEach((payment) => {
      // By method
      if (!byMethod[payment.method]) {
        byMethod[payment.method] = { count: 0, amount: 0 };
      }
      byMethod[payment.method].count++;
      if (payment.status === PaymentStatus.SUCCESS) {
        byMethod[payment.method].amount += Number(payment.amount);
      }

      // By status
      byStatus[payment.status] = (byStatus[payment.status] || 0) + 1;
    });

    return {
      totalAmount: Number(aggregate._sum.amount || 0),
      totalPayments: aggregate._count,
      byMethod,
      byStatus,
    };
  }
}
