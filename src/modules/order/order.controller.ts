import { Request, Response } from 'express';
import { OrderService } from './order.service';
import {
  CreateOrderSchema,
  AddOrderItemSchema,
  AddOrderItemByBarcodeSchema,
  UpdateOrderItemSchema,
  UpdateOrderSchema,
  CancelOrderSchema,
  GetOrdersQuerySchema,
  CreateReturnSchema,
  VoidOrderSchema,
} from './order.dto';
import { AuthRequest } from '../../middlewares/auth.middleware';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Create new order (DRAFT)
   * POST /api/orders
   */
  createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const companyId = req.user!.companyId;
      const storeId = req.user!.storeId;

      if (!companyId || !storeId) {
        res.status(400).json({
          success: false,
          message: 'Company and store information required',
        });
        return;
      }

      // Validate input
      const validatedData = CreateOrderSchema.parse(req.body);

      // Get active shift ID if exists (optional for now)
      const shiftId = req.body.shiftId; // Frontend can pass active shift ID

      const order = await this.orderService.createOrder(
        validatedData,
        userId,
        companyId,
        storeId,
        shiftId
      );

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create order',
      });
    }
  };

  /**
   * Add item to order
   * POST /api/orders/:orderId/items
   */
  addItemToOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;

      // Validate input
      const validatedData = AddOrderItemSchema.parse(req.body);

      const orderItem = await this.orderService.addItemToOrder(orderId, validatedData, userId);

      res.status(201).json({
        success: true,
        message: 'Item added to order successfully',
        data: orderItem,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add item to order',
      });
    }
  };

  /**
   * Add item to order by barcode (POS scanning)
   * POST /api/orders/:orderId/items/barcode
   */
  addItemByBarcode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const companyId = req.user!.companyId;
      const storeId = req.user!.storeId;
      const { orderId } = req.params;

      if (!companyId || !storeId) {
        res.status(400).json({
          success: false,
          message: 'Company and store information required',
        });
        return;
      }

      // Validate input
      const validatedData = AddOrderItemByBarcodeSchema.parse(req.body);

      const result = await this.orderService.addItemByBarcode(
        orderId,
        validatedData,
        userId,
        companyId,
        storeId
      );

      res.status(result.action === 'added' ? 201 : 200).json({
        success: true,
        message: result.message,
        action: result.action,
        data: result.orderItem,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add item by barcode',
      });
    }
  };

  /**
   * Update order item
   * PATCH /api/orders/:orderId/items/:itemId
   */
  updateOrderItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId, itemId } = req.params;

      // Validate input
      const validatedData = UpdateOrderItemSchema.parse(req.body);

      const orderItem = await this.orderService.updateOrderItem(
        orderId,
        itemId,
        validatedData,
        userId
      );

      res.json({
        success: true,
        message: 'Order item updated successfully',
        data: orderItem,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update order item',
      });
    }
  };

  /**
   * Remove item from order
   * DELETE /api/orders/:orderId/items/:itemId
   */
  removeOrderItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId, itemId } = req.params;

      const result = await this.orderService.removeOrderItem(orderId, itemId, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove order item',
      });
    }
  };

  /**
   * Update order details
   * PATCH /api/orders/:orderId
   */
  updateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;

      // Validate input
      const validatedData = UpdateOrderSchema.parse(req.body);

      const order = await this.orderService.updateOrder(orderId, validatedData, userId);

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update order',
      });
    }
  };

  /**
   * Confirm order (DRAFT → PENDING)
   * POST /api/orders/:orderId/confirm
   */
  confirmOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;

      const order = await this.orderService.confirmOrder(orderId, userId);

      res.json({
        success: true,
        message: 'Order confirmed successfully',
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to confirm order',
      });
    }
  };

  /**
   * Cancel order
   * POST /api/orders/:orderId/cancel
   */
  cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;

      // Validate input
      const validatedData = CancelOrderSchema.parse(req.body);

      const order = await this.orderService.cancelOrder(orderId, validatedData, userId);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel order',
      });
    }
  };

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   */
  getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const companyId = req.user!.companyId;
      const storeId = req.user!.storeId;
      const { orderId } = req.params;

      const order = await this.orderService.getOrderById(
        orderId,
        userId,
        userRole,
        companyId,
        storeId
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(error.message === 'Access denied' ? 403 : 404).json({
        success: false,
        message: error.message || 'Order not found',
      });
    }
  };

  /**
   * Get orders with filters
   * GET /api/orders
   */
  getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const companyId = req.user!.companyId;
      const storeId = req.user!.storeId;

      // Validate query parameters
      const validatedQuery = GetOrdersQuerySchema.parse(req.query);

      const result = await this.orderService.getOrders(
        validatedQuery,
        userId,
        userRole,
        companyId,
        storeId
      );

      res.json({
        success: true,
        data: result.orders,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch orders',
      });
    }
  };

  /**
   * Create return bill
   * POST /api/orders/return
   */
  createReturnBill = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, companyId, storeId } = req.user!;

      // Validate request body
      const validatedData = CreateReturnSchema.parse(req.body);

      const returnOrder = await this.orderService.createReturnBill(
        validatedData,
        userId,
        companyId!,
        storeId!
      );

      res.status(201).json({
        success: true,
        message: 'Return bill created successfully. Process refund to complete.',
        data: returnOrder,
      });
    } catch (error: any) {
      console.error('Create return error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create return bill',
      });
    }
  };

  /**
   * Void order (same-day only, manager approval required)
   * POST /api/orders/:id/void
   */
  voidOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, role, companyId, storeId } = req.user!;

      // Validate request body
      const validatedData = VoidOrderSchema.parse(req.body);

      const voidOrder = await this.orderService.voidOrder(
        id,
        validatedData,
        userId,
        role,
        companyId!,
        storeId!
      );

      res.status(201).json({
        success: true,
        message: 'Order voided successfully. Process refund to complete.',
        data: voidOrder,
      });
    } catch (error: any) {
      console.error('Void order error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to void order',
      });
    }
  };
}
