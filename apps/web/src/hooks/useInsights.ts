import { useQuery } from '@tanstack/react-query';
import {
  fetchDepartmentBreakdown,
  fetchSalaryByCountry,
  fetchSalaryByJobTitle,
  fetchSalaryDistribution,
  fetchTopEarners,
} from '../api/insights.api.js';

export function useSalaryByCountry() {
  return useQuery({
    queryKey: ['insights', 'salary-by-country'],
    queryFn: fetchSalaryByCountry,
  });
}

export function useSalaryByJobTitle(country?: string) {
  return useQuery({
    queryKey: ['insights', 'salary-by-job-title', country],
    queryFn: () => fetchSalaryByJobTitle(country),
  });
}

export function useDepartmentBreakdown() {
  return useQuery({
    queryKey: ['insights', 'department-breakdown'],
    queryFn: fetchDepartmentBreakdown,
  });
}

export function useSalaryDistribution(buckets = 10) {
  return useQuery({
    queryKey: ['insights', 'salary-distribution', buckets],
    queryFn: () => fetchSalaryDistribution(buckets),
  });
}

export function useTopEarners(limit = 10) {
  return useQuery({
    queryKey: ['insights', 'top-earners', limit],
    queryFn: () => fetchTopEarners(limit),
  });
}
