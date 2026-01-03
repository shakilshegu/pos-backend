import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  companyId: z.string().uuid('Invalid company ID'),
  isActive: z.boolean().optional(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const SearchCustomerSchema = z.object({
  phone: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  companyId: z.string().uuid().optional(),
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>;
export type SearchCustomerDto = z.infer<typeof SearchCustomerSchema>;
