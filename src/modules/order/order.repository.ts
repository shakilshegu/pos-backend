import { PrismaClient, Order, OrderItem, OrderStatus, CustomerType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderRepository {
  /**
   * Create a new order in DRAFT status
   */
  async create(data: {
    orderNumber: string;
    companyId: string;
    storeId: string;
    cashierId: string;
    shiftId?: string;
    customerType: CustomerType;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }): Promise<Order> {
    return await prisma.order.create({
      data: {
        ...data,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        status: OrderStatus.DRAFT,
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find order by ID with all relations
   */
  async findById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        cashier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        cashShift: {
          select: {
            id: true,
            status: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string) {
    return await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  /**
   * Update order details (only for DRAFT orders)
   */
  async update(
    id: string,
    data: {
      customerType?: CustomerType;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
    }
  ) {
    return await prisma.order.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  /**
   * Add item to order
   */
  async addItem(data: {
    orderId: string;
    productId: string;
    productVariantId: string;
    productName: string;
    variantName: string;
    sku: string | null;
    unitPrice: number;
    quantity: number;
    taxRate: number;
    taxAmount: number;
    discountAmount: number;
    subtotal: number;
    totalAmount: number;
  }): Promise<OrderItem> {
    return await prisma.orderItem.create({
      data,
      include: {
        product: true,
        productVariant: true,
      },
    });
  }

  /**
   * Update order item
   */
  async updateItem(
    itemId: string,
    data: {
      quantity?: number;
      discountAmount?: number;
      taxAmount?: number;
      subtotal?: number;
      totalAmount?: number;
    }
  ) {
    return await prisma.orderItem.update({
      where: { id: itemId },
      data,
      include: {
        product: true,
        productVariant: true,
      },
    });
  }

  /**
   * Remove item from order
   */
  async removeItem(itemId: string): Promise<void> {
    await prisma.orderItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Recalculate and update order totals
   */
  async updateTotals(
    orderId: string,
    totals: {
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
    }
  ) {
    return await prisma.order.update({
      where: { id: orderId },
      data: totals,
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  /**
   * Transition order to PENDING status
   */
  async confirmOrder(orderId: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PENDING },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  /**
   * Transition order to PAID status
   */
  async markAsPaid(orderId: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Cancel order
   */
  async cancel(orderId: string, cancelledBy: string, cancelReason: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy,
        cancelReason,
      },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  /**
   * Find orders with filters (role-based)
   */
  async findMany(filters: {
    companyId?: string;
    storeId?: string;
    cashierId?: string;
    shiftId?: string;
    status?: OrderStatus;
    customerType?: CustomerType;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where: Prisma.OrderWhereInput = {};

    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.cashierId) where.cashierId = filters.cashierId;
    if (filters.shiftId) where.shiftId = filters.shiftId;
    if (filters.status) where.status = filters.status;
    if (filters.customerType) where.customerType = filters.customerType;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
              productVariant: true,
            },
          },
          cashier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  /**
   * Generate unique order number
   * Format: ORD-YYYYMMDD-XXX (e.g., ORD-20240115-001)
   */
  async generateOrderNumber(storeId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Find the last order for today in this store
    const lastOrder = await prisma.order.findFirst({
      where: {
        storeId,
        orderNumber: {
          startsWith: `ORD-${dateStr}`,
        },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Get order item by ID
   */
  async findItemById(itemId: string) {
    return await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: true,
        product: true,
        productVariant: true,
      },
    });
  }
}
