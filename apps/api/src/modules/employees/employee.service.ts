import type { CreateEmployee, Employee } from '@salary-mgmt/shared';
import {
  CreateEmployeeSchema,
  EmployeeListQuerySchema,
  UpdateEmployeeSchema,
} from '@salary-mgmt/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../errors/domainErrors.js';
import type { IEmployeeRepository } from './employee.repository.js';

const PG_UNIQUE = '23505';
const PRISMA_UNIQUE = 'P2002';

function isPgUnique(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === PG_UNIQUE
  );
}

function isPrismaUnique(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === PRISMA_UNIQUE
  );
}

export class EmployeeService {
  constructor(private readonly repo: IEmployeeRepository) {}

  async createEmployee(payload: unknown): Promise<Employee> {
    const parsed = CreateEmployeeSchema.safeParse(payload);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join('.') || '_root';
        if (!details[p]) details[p] = [];
        details[p].push(issue.message);
      }
      throw new ValidationError('Validation failed', details);
    }
    try {
      return await this.repo.create(parsed.data);
    } catch (e) {
      if (isPgUnique(e) || isPrismaUnique(e)) {
        throw new ConflictError('Email already exists');
      }
      throw e;
    }
  }

  async getEmployee(id: number): Promise<Employee> {
    const emp = await this.repo.findById(id);
    if (!emp) throw new NotFoundError('Employee', id);
    return emp;
  }

  async listEmployees(query: unknown) {
    const parsed = EmployeeListQuerySchema.safeParse(query);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join('.') || '_root';
        if (!details[p]) details[p] = [];
        details[p].push(issue.message);
      }
      throw new ValidationError('Validation failed', details);
    }
    const q = parsed.data;
    const pageSize = Math.min(q.pageSize, 100);
    return this.repo.findAll({
      ...q,
      pageSize,
      status: q.status ?? 'active',
    });
  }

  async updateEmployee(
    id: number,
    payload: unknown,
    partial: boolean,
  ): Promise<Employee> {
    const schema = partial ? UpdateEmployeeSchema : CreateEmployeeSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join('.') || '_root';
        if (!details[p]) details[p] = [];
        details[p].push(issue.message);
      }
      throw new ValidationError('Validation failed', details);
    }
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Employee', id);
    const data = parsed.data as Partial<CreateEmployee>;
    if (partial && Object.keys(data).length === 0) {
      return existing;
    }
    try {
      const updated = await this.repo.update(
        id,
        data as Partial<CreateEmployee>,
      );
      if (!updated) throw new NotFoundError('Employee', id);
      return updated;
    } catch (e) {
      if (isPgUnique(e) || isPrismaUnique(e)) {
        throw new ConflictError('Email already exists');
      }
      throw e;
    }
  }

  async deleteEmployee(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Employee', id);
    await this.repo.softDelete(id);
  }
}
