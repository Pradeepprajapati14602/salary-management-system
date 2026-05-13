import type {
  CountrySalaryStats,
  DepartmentStats,
  DistributionBucket,
  JobTitleSalaryStats,
} from './insights.repository.js';
import type { Employee } from '@salary-mgmt/shared';
import {
  SalaryByJobTitleQuerySchema,
  SalaryDistributionQuerySchema,
  TopEarnersQuerySchema,
} from '@salary-mgmt/shared';
import { ValidationError } from '../../errors/domainErrors.js';
import type { IInsightsRepository } from './insights.repository.js';

export class InsightsService {
  constructor(private readonly repo: IInsightsRepository) {}

  async salaryByCountry(): Promise<{
    data: CountrySalaryStats[];
    generatedAt: string;
  }> {
    const data = await this.repo.getSalaryStatsByCountry();
    return { data, generatedAt: new Date().toISOString() };
  }

  async salaryByJobTitle(query: unknown): Promise<{
    data: JobTitleSalaryStats[];
    generatedAt: string;
  }> {
    const parsed = SalaryByJobTitleQuerySchema.safeParse(query);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join('.') || '_root';
        if (!details[p]) details[p] = [];
        details[p].push(issue.message);
      }
      throw new ValidationError('Validation failed', details);
    }
    const data = await this.repo.getSalaryStatsByJobTitle(
      parsed.data.country,
    );
    return { data, generatedAt: new Date().toISOString() };
  }

  async departmentBreakdown(): Promise<{
    data: DepartmentStats[];
    generatedAt: string;
  }> {
    const data = await this.repo.getDepartmentBreakdown();
    return { data, generatedAt: new Date().toISOString() };
  }

  async salaryDistribution(query: unknown): Promise<{
    data: DistributionBucket[];
    generatedAt: string;
  }> {
    const parsed = SalaryDistributionQuerySchema.safeParse(query);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join('.') || '_root';
        if (!details[p]) details[p] = [];
        details[p].push(issue.message);
      }
      throw new ValidationError('Validation failed', details);
    }
    const data = await this.repo.getSalaryDistribution(parsed.data.buckets);
    return { data, generatedAt: new Date().toISOString() };
  }

  async topEarners(query: unknown): Promise<{
    data: Employee[];
    generatedAt: string;
  }> {
    const parsed = TopEarnersQuerySchema.safeParse(query);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join('.') || '_root';
        if (!details[p]) details[p] = [];
        details[p].push(issue.message);
      }
      throw new ValidationError('Validation failed', details);
    }
    const data = await this.repo.getTopEarners(parsed.data.limit);
    return { data, generatedAt: new Date().toISOString() };
  }
}
