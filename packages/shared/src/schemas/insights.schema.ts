import { z } from 'zod';

export const SalaryByJobTitleQuerySchema = z.object({
  country: z.string().optional(),
});

export const TopEarnersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const SalaryDistributionQuerySchema = z.object({
  buckets: z.coerce.number().int().min(1).max(50).default(10),
});
