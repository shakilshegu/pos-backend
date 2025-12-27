import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),

  // Pricing
  baseRetailPrice: z.number().positive('Base retail price must be positive'),
  baseWholesalePrice: z.number().positive().optional(),
  baseCost: z.number().positive().optional(),
  taxPercent: z.number().min(0).max(100).optional(),

  // Organization
  categoryId: z.string().uuid().optional(),
  companyId: z.string().uuid('Invalid company ID'),
  storeId: z.string().uuid('Invalid store ID'),

  // Unit
  unit: z.string().optional(),

  // Status
  isActive: z.boolean().optional(),

  // Image
  mainImageUrl: z.string().url().optional(),

  // Legacy support (backward compatibility)
  price: z.number().positive().optional(), // Maps to baseRetailPrice
  cost: z.number().positive().optional(),  // Maps to baseCost
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),

  // Pricing
  baseRetailPrice: z.number().positive().optional(),
  baseWholesalePrice: z.number().positive().optional(),
  baseCost: z.number().positive().optional(),
  taxPercent: z.number().min(0).max(100).optional(),

  // Organization
  categoryId: z.string().uuid().optional(),

  // Unit
  unit: z.string().optional(),

  // Status
  isActive: z.boolean().optional(),

  // Image
  mainImageUrl: z.string().url().optional(),

  // Legacy support
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
