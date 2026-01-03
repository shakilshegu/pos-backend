import { z } from 'zod';
import { PaymentMethod, PaymentStatus, PaymentProvider } from '@prisma/client';

/**
 * DTO for creating a payment
 */
export const CreatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive('Amount must be positive'),
  customerRef: z.string().optional(), // Customer phone or identifier for TAP
  notes: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;

/**
 * DTO for processing a refund
 */
export const RefundPaymentSchema = z.object({
  refundReason: z.string().min(1, 'Refund reason is required'),
  amount: z.number().positive('Refund amount must be positive').optional(), // For partial refunds
});

export type RefundPaymentDto = z.infer<typeof RefundPaymentSchema>;

/**
 * DTO for TAP webhook payload
 */
export const TapWebhookSchema = z.object({
  id: z.string(), // Charge ID
  object: z.string(),
  status: z.string(), // INITIATED, CAPTURED, FAILED, etc.
  amount: z.number(),
  currency: z.string(),
  customer: z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    phone: z.object({
      country_code: z.string().optional(),
      number: z.string().optional(),
    }).optional(),
  }).optional(),
  reference: z.object({
    transaction: z.string().optional(),
    order: z.string().optional(), // Our payment ID
  }).optional(),
  response: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
  receipt: z.object({
    id: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
  card: z.object({
    first_six: z.string().optional(),
    last_four: z.string().optional(),
    brand: z.string().optional(),
    scheme: z.string().optional(),
  }).optional(),
  transaction: z.object({
    timezone: z.string().optional(),
    created: z.string().optional(),
    url: z.string().optional(),
    expiry: z.object({
      period: z.number().optional(),
      type: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type TapWebhookDto = z.infer<typeof TapWebhookSchema>;

/**
 * Query parameters for listing payments
 */
export const GetPaymentsQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  provider: z.nativeEnum(PaymentProvider).optional(),
  storeId: z.string().uuid().optional(),
  from: z.string().datetime().optional(), // ISO date string
  to: z.string().datetime().optional(),   // ISO date string
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetPaymentsQueryDto = z.infer<typeof GetPaymentsQuerySchema>;
