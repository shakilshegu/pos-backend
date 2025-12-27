import { OrderStatus, CustomerType } from '@prisma/client';
import { OrderRepository } from './order.repository';
import { PrismaClient } from '@prisma/client';
import {
  CreateOrderDto,
  AddOrderItemDto,
  UpdateOrderItemDto,
  UpdateOrderDto,
  CancelOrderDto,
  GetOrdersQueryDto,
} from './order.dto';

const prisma = new PrismaClient();

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  /**
   * Create a new order in DRAFT status
   */
  async createOrder(
    data: CreateOrderDto,
    userId: string,
    companyId: string,
    storeId: string,
    shiftId?: string
  ) {
    // Generate unique order number
    const orderNumber = await this.orderRepository.generateOrderNumber(storeId);

    // Create order
    const order = await this.orderRepository.create({
      orderNumber,
      companyId,
      storeId,
      cashierId: userId,
      shiftId,
      customerType: data.customerType,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
    });

    return order;
  }

  /**
   * Add item to order with server-side calculations
   */
  async addItemToOrder(orderId: string, data: AddOrderItemDto, userId: string) {
    // Get order and validate
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Only DRAFT orders can be modified
    if (order.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify order that is not in DRAFT status');
    }

    // Get product variant with product details
    const productVariant = await prisma.productVariant.findUnique({
      where: { id: data.productVariantId },
      include: {
        product: true,
      },
    });

    if (!productVariant || !productVariant.isActive || !productVariant.product.isActive) {
      throw new Error('Product variant not found or inactive');
    }

    // Determine price based on customer type
    const unitPrice =
      order.customerType === CustomerType.WHOLESALE && productVariant.wholesalePrice
        ? Number(productVariant.wholesalePrice)
        : Number(productVariant.retailPrice);

    // Calculate item totals (server-side)
    const taxRate = Number(productVariant.product.taxPercent);
    const subtotal = unitPrice * data.quantity;
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Add item to order
    const orderItem = await this.orderRepository.addItem({
      orderId,
      productId: productVariant.product.id,
      productVariantId: productVariant.id,
      productName: productVariant.product.name,
      variantName: productVariant.name,
      sku: productVariant.sku,
      unitPrice,
      quantity: data.quantity,
      taxRate,
      taxAmount,
      discountAmount,
      subtotal,
      totalAmount,
    });

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    return orderItem;
  }

  /**
   * Update order item quantity or discount
   */
  async updateOrderItem(
    orderId: string,
    itemId: string,
    data: UpdateOrderItemDto,
    userId: string
  ) {
    // Get order and validate
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Only DRAFT orders can be modified
    if (order.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify order that is not in DRAFT status');
    }

    // Get order item
    const orderItem = await this.orderRepository.findItemById(itemId);
    if (!orderItem || orderItem.orderId !== orderId) {
      throw new Error('Order item not found');
    }

    // Recalculate if quantity or discount changed
    const quantity = data.quantity ?? orderItem.quantity;
    const discountAmount = data.discountAmount ?? Number(orderItem.discountAmount);

    const subtotal = Number(orderItem.unitPrice) * quantity;
    const taxAmount = (subtotal * Number(orderItem.taxRate)) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Update item
    const updatedItem = await this.orderRepository.updateItem(itemId, {
      quantity,
      discountAmount,
      taxAmount,
      subtotal,
      totalAmount,
    });

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    return updatedItem;
  }

  /**
   * Remove item from order
   */
  async removeOrderItem(orderId: string, itemId: string, userId: string) {
    // Get order and validate
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Only DRAFT orders can be modified
    if (order.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify order that is not in DRAFT status');
    }

    // Get order item
    const orderItem = await this.orderRepository.findItemById(itemId);
    if (!orderItem || orderItem.orderId !== orderId) {
      throw new Error('Order item not found');
    }

    // Remove item
    await this.orderRepository.removeItem(itemId);

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    return { message: 'Order item removed successfully' };
  }

  /**
   * Update order details (customer info, notes)
   */
  async updateOrder(orderId: string, data: UpdateOrderDto, userId: string) {
    // Get order and validate
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Only DRAFT orders can be modified
    if (order.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify order that is not in DRAFT status');
    }

    // Update order
    const updatedOrder = await this.orderRepository.update(orderId, data);

    return updatedOrder;
  }

  /**
   * Confirm order (DRAFT → PENDING)
   */
  async confirmOrder(orderId: string, userId: string) {
    // Get order and validate
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Must be in DRAFT status
    if (order.status !== OrderStatus.DRAFT) {
      throw new Error('Only DRAFT orders can be confirmed');
    }

    // Must have at least one item
    if (!order.items || order.items.length === 0) {
      throw new Error('Cannot confirm order with no items');
    }

    // Transition to PENDING
    const confirmedOrder = await this.orderRepository.confirmOrder(orderId);

    return confirmedOrder;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, data: CancelOrderDto, userId: string) {
    // Get order and validate
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Can only cancel DRAFT or PENDING orders
    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING) {
      throw new Error('Only DRAFT or PENDING orders can be cancelled');
    }

    // Cancel order
    const cancelledOrder = await this.orderRepository.cancel(
      orderId,
      userId,
      data.cancelReason
    );

    return cancelledOrder;
  }

  /**
   * Get order by ID with access control
   */
  async getOrderById(orderId: string, userId: string, userRole: string, companyId?: string, storeId?: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Access control
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can see all orders
      return order;
    } else if (userRole === 'ADMIN') {
      // Admin can see orders from their company
      if (order.companyId !== companyId) {
        throw new Error('Access denied');
      }
    } else if (userRole === 'MANAGER') {
      // Manager can see orders from their store
      if (order.storeId !== storeId) {
        throw new Error('Access denied');
      }
    } else if (userRole === 'CASHIER') {
      // Cashier can only see their own orders
      if (order.cashierId !== userId) {
        throw new Error('Access denied');
      }
    }

    return order;
  }

  /**
   * Get orders with filters and role-based access control
   */
  async getOrders(
    query: GetOrdersQueryDto,
    userId: string,
    userRole: string,
    companyId?: string,
    storeId?: string
  ) {
    const filters: any = {
      page: query.page,
      limit: query.limit,
    };

    // Role-based filtering
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can see all orders (apply query filters only)
      // No automatic filtering - can filter by storeId via query params
    } else if (userRole === 'ADMIN') {
      // Admin can see all orders from their company
      filters.companyId = companyId;
    } else if (userRole === 'MANAGER') {
      // Manager can see orders from their store
      filters.storeId = storeId;
    } else if (userRole === 'CASHIER') {
      // Cashier can only see their own orders
      filters.cashierId = userId;
    }

    // Apply additional query filters
    if (query.storeId) {
      filters.storeId = query.storeId;
    }
    if (query.status) filters.status = query.status;
    if (query.customerType) filters.customerType = query.customerType;
    if (query.cashierId) filters.cashierId = query.cashierId;
    if (query.shiftId) filters.shiftId = query.shiftId;
    if (query.from) filters.from = new Date(query.from);
    if (query.to) filters.to = new Date(query.to);

    const result = await this.orderRepository.findMany(filters);

    return result;
  }

  /**
   * Recalculate order totals from all items (server-side)
   */
  private async recalculateOrderTotals(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Calculate totals from items
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const taxAmount = order.items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
    const discountAmount = order.items.reduce((sum, item) => sum + Number(item.discountAmount), 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Update order
    await this.orderRepository.updateTotals(orderId, {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
    });
  }

  /**
   * Mark order as PAID (called by Payment service after successful payment)
   */
  async markOrderAsPaid(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Only PENDING orders can be marked as PAID');
    }

    return await this.orderRepository.markAsPaid(orderId);
  }
}
