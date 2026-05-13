import { z } from 'zod';

const hireDateSchema = z
  .string()
  .min(1, 'Required')
  .refine((s) => {
    const t = Date.parse(s);
    return !Number.isNaN(t);
  }, 'Invalid datetime');

export const CreateEmployeeSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().email(),
  jobTitle: z.string().trim().min(2).max(100),
  department: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  salary: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default('USD'),
  hireDate: hireDateSchema,
  status: z.enum(['active', 'inactive']).default('active'),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const EmployeeSchema = CreateEmployeeSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;

export const EmployeeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
  search: z.string().optional(),
  country: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.enum(['salary', 'fullName', 'hireDate', 'id']).default('id'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export type EmployeeListQuery = z.infer<typeof EmployeeListQuerySchema>;

export const EmployeeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
