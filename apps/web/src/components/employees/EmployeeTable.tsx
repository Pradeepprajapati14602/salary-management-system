import type { Employee } from '@salary-mgmt/shared';
import { IconPencil, IconSearch, IconTrash } from '../icons.js';

type SortBy = 'id' | 'salary' | 'fullName' | 'hireDate';
type SortDir = 'asc' | 'desc';

interface EmployeeTableProps {
    employees: Employee[];
    isLoading: boolean;
    sortBy: SortBy;
    sortDir: SortDir;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onSortChange: (col: SortBy) => void;
    onPageChange: (p: number) => void;
    onEdit: (emp: Employee) => void;
    onDelete: (emp: Employee) => void;
}

function SortIcon({ col, current, dir }: { col: string; current: string; dir: SortDir }) {
    if (col !== current) return <span style={{ opacity: .3 }}>↕</span>;
    return <span>{dir === 'asc' ? '↑' : '↓'}</span>;
}

const COL_LABELS: Record<SortBy, string> = {
    id: 'ID', salary: 'Salary', fullName: 'Name', hireDate: 'Hire Date',
};

const fmtSalary = (n: number, cur: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);

export function EmployeeTable({
    employees, isLoading, sortBy, sortDir, page, pageSize,
    total, totalPages, onSortChange, onPageChange, onEdit, onDelete,
}: EmployeeTableProps) {
    if (isLoading) {
        return (
            <div className="table-wrap">
                <div className="loading-center">
                    <span className="spinner" />
                    Loading employees…
                </div>
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <div className="table-wrap">
                <div className="empty-state">
                    <div className="empty-state-icon" aria-hidden>
                        <IconSearch size={36} />
                    </div>
                    <div className="empty-state-text">No employees found</div>
                    <div>Try adjusting your filters or add a new employee.</div>
                </div>
            </div>
        );
    }

    const sortableCol = (col: SortBy) => (
        <th
            key={col}
            className="sortable"
            onClick={() => onSortChange(col)}
            aria-sort={sortBy === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
            {COL_LABELS[col]} <SortIcon col={col} current={sortBy} dir={sortDir} />
        </th>
    );

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="table-wrap">
            <table className="table" role="grid" aria-label="employees table">
                <thead>
                    <tr>
                        {sortableCol('id')}
                        {sortableCol('fullName')}
                        <th>Email</th>
                        <th>Job Title</th>
                        <th>Department</th>
                        <th>Country</th>
                        {sortableCol('salary')}
                        {sortableCol('hireDate')}
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp) => (
                        <tr key={emp.id}>
                            <td className="text-muted">{emp.id}</td>
                            <td style={{ fontWeight: 500 }}>{emp.fullName}</td>
                            <td className="text-muted truncate" style={{ maxWidth: 180 }}>{emp.email}</td>
                            <td>{emp.jobTitle}</td>
                            <td>{emp.department}</td>
                            <td>{emp.country}</td>
                            <td className="font-mono">{fmtSalary(emp.salary, emp.currency)}</td>
                            <td className="text-muted">{emp.hireDate}</td>
                            <td>
                                <span className={`badge badge-${emp.status}`}>{emp.status}</span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        id={`edit-employee-${emp.id}`}
                                        className="btn-icon"
                                        title="Edit"
                                        onClick={() => onEdit(emp)}
                                        aria-label={`Edit ${emp.fullName}`}
                                    >
                                        <IconPencil size={16} />
                                    </button>
                                    <button
                                        id={`delete-employee-${emp.id}`}
                                        className="btn-icon"
                                        title="Delete"
                                        onClick={() => onDelete(emp)}
                                        aria-label={`Delete ${emp.fullName}`}
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <IconTrash size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="pagination">
                <span className="pagination-info">
                    Showing {from}–{to} of {total} employees
                </span>
                <div className="pagination-controls">
                    <button
                        id="pagination-prev"
                        className="btn btn-ghost btn-sm"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        aria-label="Previous page"
                    >
                        ← Prev
                    </button>
                    <span className="pagination-page">
                        Page {page} / {totalPages}
                    </span>
                    <button
                        id="pagination-next"
                        className="btn btn-ghost btn-sm"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        aria-label="Next page"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}
