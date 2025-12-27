import { z } from 'zod';

export const CreateInventorySchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  reorderLevel: z.number().int().min(0).optional(),
  productVariantId: z.string().uuid('Invalid product variant ID'),
  storeId: z.string().uuid('Invalid store ID'),
});

export const UpdateInventorySchema = z.object({
  quantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
});

export const AdjustInventorySchema = z.object({
  adjustment: z.number().int(), // Can be positive (add) or negative (remove)
  reason: z.string().optional(),
});

export type CreateInventoryDto = z.infer<typeof CreateInventorySchema>;
export type UpdateInventoryDto = z.infer<typeof UpdateInventorySchema>;
export type AdjustInventoryDto = z.infer<typeof AdjustInventorySchema>;
