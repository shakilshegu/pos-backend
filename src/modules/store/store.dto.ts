import { z } from 'zod';

export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().uuid('Invalid company ID'),
  isActive: z.boolean().optional(),
});

export const UpdateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>;
