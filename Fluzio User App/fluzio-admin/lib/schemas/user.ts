import { z } from 'zod';

export const suspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const unsuspendUserSchema = z.object({
  userId: z.string().min(1),
});

export const updateUserKYCSchema = z.object({
  userId: z.string().min(1),
  verified: z.boolean(),
});

export const addUserStrikeSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type UnsuspendUserInput = z.infer<typeof unsuspendUserSchema>;
export type UpdateUserKYCInput = z.infer<typeof updateUserKYCSchema>;
export type AddUserStrikeInput = z.infer<typeof addUserStrikeSchema>;
