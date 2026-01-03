import { OrderStatus, CustomerType, OrderType } from '@prisma/client';
import { OrderRepository } from './order.repository';
import { PrismaClient } from '@prisma/client';
import {
  CreateOrderDto,
  AddOrderItemDto,
  AddOrderItemByBarcodeDto,
  UpdateOrderItemDto,
  UpdateOrderDto,
  CancelOrderDto,
  GetOrdersQueryDto,
  CreateReturnDto,
  VoidOrderDto,
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
   * Add item to order by barcode (POS scanning)
   * If item already exists in order, increase quantity
   * If not, add as new item
   */
  async addItemByBarcode(
    orderId: string,
    data: AddOrderItemByBarcodeDto,
    userId: string,
    companyId: string,
    storeId: string
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

    // Verify order belongs to user's company and store
    if (order.companyId !== companyId || order.storeId !== storeId) {
      throw new Error('Access denied: Order does not belong to your company/store');
    }

    // Find product variant by barcode
    const productVariant = await prisma.productVariant.findUnique({
      where: { barcode: data.barcode },
      include: {
        product: {
          include: {
            company: true,
            store: true,
          },
        },
        inventory: {
          where: {
            storeId: storeId,
          },
        },
      },
    });

    if (!productVariant) {
      throw new Error('Product not found with barcode: ' + data.barcode);
    }

    if (!productVariant.isActive || !productVariant.product.isActive) {
      throw new Error('Product is inactive');
    }

    // Verify product belongs to same company
    if (productVariant.product.companyId !== companyId) {
      throw new Error('Product does not belong to your company');
    }

    // Check inventory availability
    const inventory = productVariant.inventory[0];
    if (!inventory || inventory.quantity <= 0) {
      throw new Error(
        `Product "${productVariant.product.name} - ${productVariant.name}" is out of stock`
      );
    }

    // Check if requested quantity is available
    if (inventory.quantity < data.quantity) {
      throw new Error(
        `Insufficient stock. Available: ${inventory.quantity}, Requested: ${data.quantity}`
      );
    }

    // Check if item already exists in order
    const existingItem = order.items.find(
      (item) => item.productVariantId === productVariant.id
    );

    if (existingItem) {
      // Item exists: Increase quantity
      const newQuantity = existingItem.quantity + data.quantity;

      // Check if new quantity exceeds available stock
      if (newQuantity > inventory.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${inventory.quantity}, Total requested: ${newQuantity}`
        );
      }

      // Update existing item quantity
      const updatedItem = await this.updateOrderItem(
        orderId,
        existingItem.id,
        {
          quantity: newQuantity,
          discountAmount: Number(existingItem.discountAmount) + data.discountAmount,
        },
        userId
      );

      return {
        action: 'updated',
        message: `Quantity increased to ${newQuantity}`,
        orderItem: updatedItem,
      };
    } else {
      // Item doesn't exist: Add new item
      const orderItem = await this.addItemToOrder(
        orderId,
        {
          productVariantId: productVariant.id,
          quantity: data.quantity,
          discountAmount: data.discountAmount,
        },
        userId
      );

      return {
        action: 'added',
        message: 'Item added to order',
        orderItem: orderItem,
      };
    }
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

  /**
   * Create a RETURN bill for product returns
   *
   * Business Rules:
   * - Original order must be PAID
   * - Creates new bill with type RETURN
   * - Items have negative quantities
   * - Refund must be processed separately
   * - Inventory restored when return is marked PAID
   */
  async createReturnBill(
    data: CreateReturnDto,
    userId: string,
    companyId: string,
    storeId: string
  ) {
    // 1. Validate original order
    const originalOrder = await this.orderRepository.findById(data.originalOrderId);

    if (!originalOrder) {
      throw new Error('Original order not found');
    }

    if (originalOrder.status !== OrderStatus.PAID) {
      throw new Error('Only PAID orders can be returned');
    }

    if (originalOrder.type !== OrderType.SALE) {
      throw new Error('Can only create returns for SALE orders');
    }

    // Verify access
    if (originalOrder.companyId !== companyId || originalOrder.storeId !== storeId) {
      throw new Error('Access denied: Order does not belong to your company/store');
    }

    // 2. Validate return items exist in original order
    const originalItemsMap = new Map(
      originalOrder.items.map(item => [item.id, item])
    );

    for (const returnItem of data.items) {
      const originalItem = originalItemsMap.get(returnItem.orderItemId);

      if (!originalItem) {
        throw new Error(`Order item ${returnItem.orderItemId} not found in original order`);
      }

      // Validate return quantity doesn't exceed original
      if (returnItem.quantity > originalItem.quantity) {
        throw new Error(
          `Return quantity (${returnItem.quantity}) cannot exceed original quantity (${originalItem.quantity}) for ${originalItem.productName}`
        );
      }
    }

    // 3. Generate return order number
    const returnOrderNumber = await this.orderRepository.generateOrderNumber(storeId);

    // 4. Create RETURN bill
    const returnOrder = await prisma.order.create({
      data: {
        orderNumber: returnOrderNumber,
        type: OrderType.RETURN,
        parentOrderId: originalOrder.id,
        companyId: originalOrder.companyId,
        storeId: originalOrder.storeId,
        cashierId: userId,
        customerId: originalOrder.customerId,
        customerType: originalOrder.customerType,
        customerName: originalOrder.customerName,
        customerPhone: originalOrder.customerPhone,
        returnReason: data.returnReason,
        notes: data.notes,
        status: OrderStatus.DRAFT,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
      },
    });

    // 5. Add return items with negative quantities
    for (const returnItem of data.items) {
      const originalItem = originalItemsMap.get(returnItem.orderItemId)!;

      // Calculate amounts (negative for return)
      const unitPrice = Number(originalItem.unitPrice);
      const quantity = -returnItem.quantity; // NEGATIVE quantity
      const taxRate = Number(originalItem.taxRate);
      const subtotal = unitPrice * quantity; // Will be negative
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      await prisma.orderItem.create({
        data: {
          orderId: returnOrder.id,
          productId: originalItem.productId,
          productVariantId: originalItem.productVariantId,
          productName: originalItem.productName,
          variantName: originalItem.variantName,
          sku: originalItem.sku,
          unitPrice: unitPrice,
          quantity: quantity, // NEGATIVE
          taxRate: taxRate,
          taxAmount: taxAmount, // Negative
          discountAmount: 0,
          subtotal: subtotal, // Negative
          totalAmount: totalAmount, // Negative
        },
      });
    }

    // 6. Recalculate return order totals
    await this.recalculateOrderTotals(returnOrder.id);

    // 7. Return complete order with items
    return await this.orderRepository.findById(returnOrder.id);
  }

  /**
   * Void an order (same-day only, manager approval required)
   *
   * Business Rules:
   * - Original order must be PAID
   * - Must be same day as original order
   * - Manager/Admin role required
   * - Creates VOID bill with all items negated
   * - Full refund must be processed
   */
  async voidOrder(
    orderId: string,
    data: VoidOrderDto,
    userId: string,
    userRole: string,
    companyId: string,
    storeId: string
  ) {
    // 1. Verify manager/admin permission
    if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error('Only managers and admins can void orders');
    }

    // 2. Validate original order
    const originalOrder = await this.orderRepository.findById(orderId);

    if (!originalOrder) {
      throw new Error('Order not found');
    }

    if (originalOrder.status !== OrderStatus.PAID) {
      throw new Error('Only PAID orders can be voided');
    }

    if (originalOrder.type !== OrderType.SALE) {
      throw new Error('Can only void SALE orders');
    }

    // Verify access
    if (originalOrder.companyId !== companyId || originalOrder.storeId !== storeId) {
      throw new Error('Access denied: Order does not belong to your company/store');
    }

    // 3. Validate same-day only
    const orderDate = new Date(originalOrder.createdAt);
    const today = new Date();

    // Reset time to compare dates only
    orderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (orderDate.getTime() !== today.getTime()) {
      throw new Error('Orders can only be voided on the same day they were created');
    }

    // 4. Generate void order number
    const voidOrderNumber = await this.orderRepository.generateOrderNumber(storeId);

    // 5. Create VOID bill
    const voidOrder = await prisma.order.create({
      data: {
        orderNumber: voidOrderNumber,
        type: OrderType.VOID,
        parentOrderId: originalOrder.id,
        companyId: originalOrder.companyId,
        storeId: originalOrder.storeId,
        cashierId: userId,
        customerId: originalOrder.customerId,
        customerType: originalOrder.customerType,
        customerName: originalOrder.customerName,
        customerPhone: originalOrder.customerPhone,
        returnReason: data.voidReason,
        voidedBy: userId,
        voidedAt: new Date(),
        status: OrderStatus.DRAFT,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
      },
    });

    // 6. Copy all items with negative quantities (full reversal)
    for (const originalItem of originalOrder.items) {
      const unitPrice = Number(originalItem.unitPrice);
      const quantity = -originalItem.quantity; // NEGATIVE
      const taxRate = Number(originalItem.taxRate);
      const subtotal = unitPrice * quantity;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      await prisma.orderItem.create({
        data: {
          orderId: voidOrder.id,
          productId: originalItem.productId,
          productVariantId: originalItem.productVariantId,
          productName: originalItem.productName,
          variantName: originalItem.variantName,
          sku: originalItem.sku,
          unitPrice: unitPrice,
          quantity: quantity, // NEGATIVE
          taxRate: taxRate,
          taxAmount: taxAmount,
          discountAmount: 0,
          subtotal: subtotal,
          totalAmount: totalAmount,
        },
      });
    }

    // 7. Recalculate void order totals
    await this.recalculateOrderTotals(voidOrder.id);

    // 8. Return complete order with items
    return await this.orderRepository.findById(voidOrder.id);
  }

  /**
   * Restore inventory for RETURN/VOID orders when marked as PAID
   * This is called by the payment service after refund is processed
   */
  async restoreInventoryForReturn(orderId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.type !== OrderType.RETURN && order.type !== OrderType.VOID) {
      throw new Error('Can only restore inventory for RETURN or VOID orders');
    }

    // Restore inventory for each item (quantities are negative, so we add them)
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productVariantId: item.productVariantId,
          storeId: order.storeId,
        },
      });

      if (inventory) {
        // Item quantity is negative for returns, so we subtract it (which adds)
        const newQuantity = inventory.quantity - item.quantity;

        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newQuantity },
        });
      }
    }

    console.log(`Inventory restored for ${order.type} order ${order.orderNumber}`);
  }
}
