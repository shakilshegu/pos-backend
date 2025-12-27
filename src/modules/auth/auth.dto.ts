import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  companyId: z.string().uuid('Invalid company ID').optional(),  // Optional for SUPER_ADMIN
  storeId: z.string().uuid('Invalid store ID').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']).optional(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
