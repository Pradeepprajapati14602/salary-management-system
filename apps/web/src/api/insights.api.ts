const base = import.meta.env.VITE_API_URL ?? '';

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

export interface InsightsListResponse<T> {
  data: T[];
  generatedAt: string;
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const p = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) p.set(k, String(v));
    }
  }
  const q = p.toString();
  const res = await fetch(`${base}${path}${q ? `?${q}` : ''}`);
  if (!res.ok) {
    const err = new Error(await res.text());
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export function fetchSalaryByCountry() {
  return get<InsightsListResponse<CountrySalaryStats>>('/api/insights/salary-by-country');
}

export function fetchSalaryByJobTitle(country?: string) {
  return get<InsightsListResponse<JobTitleSalaryStats>>('/api/insights/salary-by-job-title', { country });
}

export function fetchDepartmentBreakdown() {
  return get<InsightsListResponse<DepartmentStats>>('/api/insights/department-breakdown');
}

export function fetchSalaryDistribution(buckets = 10) {
  return get<InsightsListResponse<DistributionBucket>>('/api/insights/salary-distribution', { buckets });
}

export function fetchTopEarners(limit = 10) {
  return get<InsightsListResponse<import('@salary-mgmt/shared').Employee>>('/api/insights/top-earners', { limit });
}
