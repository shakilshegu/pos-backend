import { z } from 'zod';

export const CreateProductVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),

  // Pricing
  retailPrice: z.number().positive('Retail price must be positive'),
  wholesalePrice: z.number().positive().optional(),
  cost: z.number().positive().optional(),

  // Attributes (flexible JSON)
  attributes: z.record(z.string(), z.any()).optional(),

  // Product relation
  productId: z.string().uuid('Invalid product ID'),

  // Status
  isActive: z.boolean().optional(),

  // For initial inventory setup
  initialStock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
});

export const UpdateProductVariantSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),

  retailPrice: z.number().positive().optional(),
  wholesalePrice: z.number().positive().optional(),
  cost: z.number().positive().optional(),

  attributes: z.record(z.string(), z.any()).optional(),

  isActive: z.boolean().optional(),
});

export type CreateProductVariantDto = z.infer<typeof CreateProductVariantSchema>;
export type UpdateProductVariantDto = z.infer<typeof UpdateProductVariantSchema>;
