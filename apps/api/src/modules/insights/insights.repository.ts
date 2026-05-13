import type { Employee } from '@salary-mgmt/shared';
import type {
  Employee as PrismaEmployee,
  PrismaClient,
} from '@prisma/client';

export interface CountrySalaryStats {
  country: string;
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface JobTitleSalaryStats {
  jobTitle: string;
  avg: number;
  count: number;
}

export interface DepartmentStats {
  department: string;
  headcount: number;
  avgSalary: number;
}

export interface DistributionBucket {
  range: string;
  count: number;
}

export interface IInsightsRepository {
  getSalaryStatsByCountry(): Promise<CountrySalaryStats[]>;
  getSalaryStatsByJobTitle(country?: string): Promise<JobTitleSalaryStats[]>;
  getDepartmentBreakdown(): Promise<DepartmentStats[]>;
  getSalaryDistribution(buckets: number): Promise<DistributionBucket[]>;
  getTopEarners(limit: number): Promise<Employee[]>;
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

export class InsightsRepository implements IInsightsRepository {
  constructor(private readonly db: PrismaClient) {}

  async getSalaryStatsByCountry(): Promise<CountrySalaryStats[]> {
    const rows = await this.db.employee.groupBy({
      by: ['country'],
      where: { status: 'active' },
      _min: { salary: true },
      _max: { salary: true },
      _avg: { salary: true },
      _count: { _all: true },
    });
    return rows
      .map((r) => ({
        country: r.country,
        min: Number(r._min.salary ?? 0),
        max: Number(r._max.salary ?? 0),
        avg: Number(r._avg.salary ?? 0),
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getSalaryStatsByJobTitle(
    country?: string,
  ): Promise<JobTitleSalaryStats[]> {
    const rows = await this.db.employee.groupBy({
      by: ['jobTitle'],
      where: {
        status: 'active',
        ...(country ? { country } : {}),
      },
      _avg: { salary: true },
      _count: { _all: true },
      orderBy: { jobTitle: 'asc' },
    });
    return rows.map((r) => ({
      jobTitle: r.jobTitle,
      avg: Number(r._avg.salary ?? 0),
      count: r._count._all,
    }));
  }

  async getDepartmentBreakdown(): Promise<DepartmentStats[]> {
    const rows = await this.db.employee.groupBy({
      by: ['department'],
      where: { status: 'active' },
      _avg: { salary: true },
      _count: { _all: true },
    });
    return rows
      .map((r) => ({
        department: r.department,
        headcount: r._count._all,
        avgSalary: Number(r._avg.salary ?? 0),
      }))
      .sort((a, b) => b.headcount - a.headcount);
  }

  async getSalaryDistribution(buckets: number): Promise<DistributionBucket[]> {
    const mm = await this.db.employee.aggregate({
      where: { status: 'active' },
      _min: { salary: true },
      _max: { salary: true },
      _count: { _all: true },
    });
    const count = mm._count._all;
    if (count === 0 || mm._min.salary === null || mm._max.salary === null) {
      return [];
    }
    const mn = Number(mm._min.salary);
    const mx = Number(mm._max.salary);
    if (mn === mx) {
      return Array.from({ length: buckets }, (_, i) => ({
        range: `${mn}`,
        count: i === 0 ? count : 0,
      }));
    }
    const span = mx - mn;
    const hi = mx + span / 1_000_000;
    const rows = await this.db.$queryRaw<Array<{ b: number; c: number }>>`
      SELECT
        width_bucket(salary::numeric, ${mn}, ${hi}, ${buckets})::int AS b,
        COUNT(*)::int AS c
      FROM employees
      WHERE status = 'active'
      GROUP BY b
      HAVING b >= 1 AND b <= ${buckets}
      ORDER BY b
    `;
    const byBucket = new Map<number, number>();
    for (const r of rows) {
      byBucket.set(r.b, r.c);
    }
    const w = span / buckets;
    const result: DistributionBucket[] = [];
    for (let i = 1; i <= buckets; i++) {
      const lo = mn + (i - 1) * w;
      const hiR = i === buckets ? mx : mn + i * w;
      const range = `${lo.toFixed(0)}–${hiR.toFixed(0)}`;
      result.push({ range, count: byBucket.get(i) ?? 0 });
    }
    return result;
  }

  async getTopEarners(limit: number): Promise<Employee[]> {
    const rows = await this.db.employee.findMany({
      where: { status: 'active' },
      orderBy: [{ salary: 'desc' }, { id: 'asc' }],
      take: limit,
    });
    return rows.map(rowToEmployee);
  }
}
