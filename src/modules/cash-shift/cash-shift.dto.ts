import { z } from 'zod';

export const OpenShiftSchema = z.object({
  openingCash: z.number().min(0, 'Opening cash must be non-negative'),
  openingNotes: z.string().optional(),
});

export const CloseShiftSchema = z.object({
  closingCash: z.number().min(0, 'Closing cash must be non-negative'),
  closingNotes: z.string().optional(),
});

export const GetShiftsQuerySchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  userId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  from: z.string().optional(), // Date string
  to: z.string().optional(),   // Date string
});

export type OpenShiftDto = z.infer<typeof OpenShiftSchema>;
export type CloseShiftDto = z.infer<typeof CloseShiftSchema>;
export type GetShiftsQueryDto = z.infer<typeof GetShiftsQuerySchema>;
