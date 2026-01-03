import { z } from 'zod';
import { CustomerType, OrderStatus, OrderType } from '@prisma/client';

/**
 * DTO for creating a new order (DRAFT)
 */
export const CreateOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional(), // Link to Customer table
  customerType: z.nativeEnum(CustomerType).default(CustomerType.RETAIL),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

/**
 * DTO for adding an item to an order
 */
export const AddOrderItemSchema = z.object({
  productVariantId: z.string().uuid('Invalid product variant ID'),
  quantity: z.number().positive('Quantity must be positive'),
  discountAmount: z.number().min(0, 'Discount cannot be negative').optional().default(0),
});

export type AddOrderItemDto = z.infer<typeof AddOrderItemSchema>;

/**
 * DTO for adding an item by barcode (POS scanning)
 */
export const AddOrderItemByBarcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  quantity: z.number().positive('Quantity must be positive').optional().default(1),
  discountAmount: z.number().min(0, 'Discount cannot be negative').optional().default(0),
});

export type AddOrderItemByBarcodeDto = z.infer<typeof AddOrderItemByBarcodeSchema>;

/**
 * DTO for updating an order item
 */
export const UpdateOrderItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  discountAmount: z.number().min(0, 'Discount cannot be negative').optional(),
});

export type UpdateOrderItemDto = z.infer<typeof UpdateOrderItemSchema>;

/**
 * DTO for updating order details (only in DRAFT status)
 */
export const UpdateOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional().nullable(),
  customerType: z.nativeEnum(CustomerType).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateOrderDto = z.infer<typeof UpdateOrderSchema>;

/**
 * DTO for confirming an order (DRAFT → PENDING)
 */
export const ConfirmOrderSchema = z.object({
  // No additional data needed - just transitions state
});

export type ConfirmOrderDto = z.infer<typeof ConfirmOrderSchema>;

/**
 * DTO for cancelling an order
 */
export const CancelOrderSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
});

export type CancelOrderDto = z.infer<typeof CancelOrderSchema>;

/**
 * DTO for creating a return bill
 */
export const CreateReturnSchema = z.object({
  originalOrderId: z.string().uuid('Invalid original order ID'),
  returnReason: z.string().min(1, 'Return reason is required'),
  items: z.array(
    z.object({
      orderItemId: z.string().uuid('Invalid order item ID'),
      quantity: z.number().positive('Return quantity must be positive'),
    })
  ).min(1, 'At least one item is required for return'),
  notes: z.string().optional(),
});

export type CreateReturnDto = z.infer<typeof CreateReturnSchema>;

/**
 * DTO for voiding an order (same-day only, manager approval required)
 */
export const VoidOrderSchema = z.object({
  voidReason: z.string().min(1, 'Void reason is required'),
});

export type VoidOrderDto = z.infer<typeof VoidOrderSchema>;

/**
 * Query parameters for listing orders
 */
export const GetOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  type: z.nativeEnum(OrderType).optional(), // Filter by order type (SALE, RETURN, VOID)
  customerType: z.nativeEnum(CustomerType).optional(),
  customerId: z.string().uuid().optional(), // Filter by customer
  cashierId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  parentOrderId: z.string().uuid().optional(), // Filter returns/voids for specific order
  from: z.string().datetime().optional(), // ISO date string
  to: z.string().datetime().optional(),   // ISO date string
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetOrdersQueryDto = z.infer<typeof GetOrdersQuerySchema>;
