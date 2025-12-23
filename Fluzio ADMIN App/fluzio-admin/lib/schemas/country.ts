import { z } from 'zod';
import { CountryStatus } from '@/lib/types';

export const createCountrySchema = z.object({
  code: z
    .string()
    .min(2, 'Country code must be at least 2 characters')
    .max(3, 'Country code must be at most 3 characters')
    .regex(/^[A-Z]+$/, 'Country code must be uppercase letters only'),
  name: z.string().min(2, 'Country name must be at least 2 characters').max(100),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .regex(/^[A-Z]+$/, 'Currency code must be uppercase letters'),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z
    .string()
    .length(2, 'Language code must be exactly 2 characters')
    .regex(/^[a-z]+$/, 'Language code must be lowercase letters'),
});

export const updateCountrySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currency: z.string().length(3).regex(/^[A-Z]+$/).optional(),
  timezone: z.string().min(1).optional(),
  language: z.string().length(2).regex(/^[a-z]+$/).optional(),
  status: z.nativeEnum(CountryStatus).optional(),
  settings: z
    .object({
      enableBusinessVerification: z.boolean().optional(),
      enableCreatorPayouts: z.boolean().optional(),
      enableEvents: z.boolean().optional(),
      autoApproveMissions: z.boolean().optional(),
    })
    .optional(),
});

export const launchChecklistItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  completed: z.boolean(),
  completedAt: z.date().optional(),
  completedBy: z.string().optional(),
  required: z.boolean(),
});

export const suspendCountrySchema = z.object({
  reason: z.string().min(10, 'Suspension reason must be at least 10 characters').max(500),
});

export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;
export type SuspendCountryInput = z.infer<typeof suspendCountrySchema>;
