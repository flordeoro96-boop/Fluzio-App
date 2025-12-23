import { z } from 'zod';

export const verifyCreatorSchema = z.object({
  creatorId: z.string().min(1),
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const updateTrustScoreSchema = z.object({
  creatorId: z.string().min(1),
  trustScore: z.number().min(0).max(100),
});

export const freezePayoutSchema = z.object({
  creatorId: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const unfreezePayoutSchema = z.object({
  creatorId: z.string().min(1),
});

export const suspendCreatorSchema = z.object({
  creatorId: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const unsuspendCreatorSchema = z.object({
  creatorId: z.string().min(1),
});

export type VerifyCreatorInput = z.infer<typeof verifyCreatorSchema>;
export type UpdateTrustScoreInput = z.infer<typeof updateTrustScoreSchema>;
export type FreezePayoutInput = z.infer<typeof freezePayoutSchema>;
export type UnfreezePayoutInput = z.infer<typeof unfreezePayoutSchema>;
export type SuspendCreatorInput = z.infer<typeof suspendCreatorSchema>;
export type UnsuspendCreatorInput = z.infer<typeof unsuspendCreatorSchema>;
