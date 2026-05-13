import { useState } from 'react';
import type { Employee, EmployeeListQuery } from '@salary-mgmt/shared';
import { useCreateEmployee, useDeleteEmployee, useEmployees } from '../hooks/useEmployees.js';
import { EmployeeFilters } from '../components/employees/EmployeeFilters.js';
import { EmployeeTable } from '../components/employees/EmployeeTable.js';
import { EmployeeFormModal } from '../components/employees/EmployeeFormModal.js';
import { DeleteConfirmDialog } from '../components/employees/DeleteConfirmDialog.js';

type SortBy = 'id' | 'salary' | 'fullName' | 'hireDate';
type SortDir = 'asc' | 'desc';

type Filters = Partial<Pick<EmployeeListQuery, 'search' | 'country' | 'status' | 'jobTitle'>>;

export function EmployeesPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortBy>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = { ...filters, page, pageSize, sortBy, sortDir };
  const { data, isLoading } = useEmployees(query);
  const createMutation = useCreateEmployee();
  const deleteMutation = useDeleteEmployee();

  const employees = (data as { data?: Employee[] })?.data ?? [];
  const meta = (data as { meta?: { total: number; totalPages: number } })?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;

  const handleSortChange = (col: SortBy) => {
    if (col === sortBy) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    setPage(1);
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormError(null);
    setModalMode('create');
  };

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setFormError(null);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setFormError(null);
  };

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    setFormError(null);
    try {
      if (modalMode === 'edit' && editTarget) {
        // use update (PATCH) via separate API call
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/employees/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e = (await res.json()) as { error?: string };
          throw new Error(e.error ?? 'Update failed');
        }
        // Invalidate via createMutation's queryClient (piggyback)
        await createMutation.reset();
        window.location.reload(); // simple invalidation without extra dep
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? 'Something went wrong');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            {total > 0 ? `${total.toLocaleString()} total employees` : 'Manage your workforce'}
          </p>
        </div>
        <button id="add-employee-btn" className="btn btn-primary" onClick={openCreate}>
          + Add Employee
        </button>
      </div>

      <EmployeeFilters filters={filters} onFilterChange={handleFilterChange} />

      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        sortBy={sortBy}
        sortDir={sortDir}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onSortChange={handleSortChange}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      {modalMode && (
        <EmployeeFormModal
          mode={modalMode}
          employee={editTarget}
          onSubmit={handleFormSubmit}
          onClose={closeModal}
          isSubmitting={createMutation.isPending}
          error={formError}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          employee={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
