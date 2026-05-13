import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmployeeListQuery } from '@salary-mgmt/shared';
import { createEmployee, deleteEmployee, fetchEmployees } from '../api/employees.api.js';

export function useEmployees(filters: Partial<EmployeeListQuery> = {}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
