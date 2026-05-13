import type {
  CreateEmployee,
  Employee,
  EmployeeListQuery,
} from '@salary-mgmt/shared';
import type {
  Employee as PrismaEmployee,
  Prisma,
  PrismaClient,
} from '@prisma/client';

export type EmployeeFilters = EmployeeListQuery;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface IEmployeeRepository {
  findAll(filters: EmployeeFilters): Promise<PaginatedResult<Employee>>;
  findById(id: number): Promise<Employee | null>;
  create(data: CreateEmployee): Promise<Employee>;
  update(id: number, data: Partial<CreateEmployee>): Promise<Employee | null>;
  softDelete(id: number): Promise<boolean>;
  count(filters: Partial<EmployeeFilters>): Promise<number>;
}

function rowToEmployee(row: PrismaEmployee): Employee {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    jobTitle: row.jobTitle,
    department: row.department,
    country: row.country,
    salary: Number(row.salary),
    currency: row.currency,
    hireDate: row.hireDate.toISOString(),
    status: row.status as 'active' | 'inactive',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildWhere(
  filters: Partial<EmployeeFilters>,
  defaults: { status?: 'active' | 'inactive' },
): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};

  const status = filters.status ?? defaults.status;
  if (status) {
    where.status = status;
  }

  if (filters.country) {
    where.country = filters.country;
  }
  if (filters.jobTitle) {
    where.jobTitle = filters.jobTitle;
  }
  if (filters.search) {
    where.fullName = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  return where;
}

const SORT_MAP: Record<string, Prisma.EmployeeScalarFieldEnum> = {
  salary: 'salary',
  fullName: 'fullName',
  hireDate: 'hireDate',
  id: 'id',
};

function toCreateData(data: CreateEmployee): Prisma.EmployeeCreateInput {
  return {
    fullName: data.fullName,
    email: data.email,
    jobTitle: data.jobTitle,
    department: data.department,
    country: data.country,
    salary: data.salary,
    currency: data.currency,
    hireDate: new Date(data.hireDate),
    status: data.status,
  };
}

function toUpdateData(data: Partial<CreateEmployee>): Prisma.EmployeeUpdateInput {
  const out: Prisma.EmployeeUpdateInput = {};
  if (data.fullName !== undefined) out.fullName = data.fullName;
  if (data.email !== undefined) out.email = data.email;
  if (data.jobTitle !== undefined) out.jobTitle = data.jobTitle;
  if (data.department !== undefined) out.department = data.department;
  if (data.country !== undefined) out.country = data.country;
  if (data.salary !== undefined) out.salary = data.salary;
  if (data.currency !== undefined) out.currency = data.currency;
  if (data.hireDate !== undefined) out.hireDate = new Date(data.hireDate);
  if (data.status !== undefined) out.status = data.status;
  return out;
}

export class EmployeeRepository implements IEmployeeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
    const f: EmployeeFilters = {
      ...filters,
      status: filters.status ?? 'active',
    };
    const pageSize = f.pageSize;
    const page = f.page;
    const offset = (page - 1) * pageSize;
    const where = buildWhere(f, {});
    const sortCol = SORT_MAP[f.sortBy] ?? 'id';
    const dir = f.sortDir === 'desc' ? 'desc' : 'asc';

    const [total, rows] = await Promise.all([
      this.db.employee.count({ where }),
      this.db.employee.findMany({
        where,
        orderBy: {
          [sortCol]: dir,
        },
        skip: offset,
        take: pageSize,
      }),
    ]);
    const totalPages =
      total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: rows.map(rowToEmployee),
      meta: { total, page, pageSize, totalPages },
    };
  }

  async findById(id: number): Promise<Employee | null> {
    if (id <= 0) return null;
    const row = await this.db.employee.findUnique({ where: { id } });
    if (!row) return null;
    return rowToEmployee(row);
  }

  async create(data: CreateEmployee): Promise<Employee> {
    const created = await this.db.employee.create({
      data: toCreateData(data),
    });
    return rowToEmployee(created);
  }

  async update(
    id: number,
    data: Partial<CreateEmployee>,
  ): Promise<Employee | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const result = await this.db.employee.updateMany({
      where: { id },
      data: toUpdateData(data),
    });

    if (result.count === 0) return null;
    return this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.db.employee.updateMany({
      where: { id, status: 'active' },
      data: { status: 'inactive' },
    });
    return result.count > 0;
  }

  async count(filters: Partial<EmployeeFilters>): Promise<number> {
    return this.db.employee.count({
      where: buildWhere(filters, {}),
    });
  }
}
