import { z } from 'zod';

export const reportQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  timeZone: z.string().max(64).default('UTC'),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
