import { z } from 'zod';

export const generatePresignedUrlSchema = z.object({
  fileType: z.enum(['company-profile', 'product', 'variant']),
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPG, PNG, and WEBP images are allowed' }),
  }),
  productId: z.string().uuid().optional(),
  variantSku: z.string().optional(),
});

export type GeneratePresignedUrlDTO = z.infer<typeof generatePresignedUrlSchema>;
