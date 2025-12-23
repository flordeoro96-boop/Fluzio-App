import { z } from 'zod';
import { BusinessTier } from '@/lib/types';

export const updateBusinessTierSchema = z.object({
  businessId: z.string().min(1),
  tier: z.nativeEnum(BusinessTier),
});

export const verifyBusinessSchema = z.object({
  businessId: z.string().min(1),
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const suspendBusinessSchema = z.object({
  businessId: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const unsuspendBusinessSchema = z.object({
  businessId: z.string().min(1),
});

export type UpdateBusinessTierInput = z.infer<typeof updateBusinessTierSchema>;
export type VerifyBusinessInput = z.infer<typeof verifyBusinessSchema>;
export type SuspendBusinessInput = z.infer<typeof suspendBusinessSchema>;
export type UnsuspendBusinessInput = z.infer<typeof unsuspendBusinessSchema>;
