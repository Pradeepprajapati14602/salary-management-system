import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmployeeTable } from '../../src/components/employees/EmployeeTable.tsx';
import type { Employee } from '@salary-mgmt/shared';

const makeEmp = (overrides: Partial<Employee> = {}): Employee => ({
    id: 1,
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    jobTitle: 'Engineer',
    department: 'Engineering',
    country: 'India',
    salary: 80000,
    currency: 'USD',
    hireDate: '2022-01-01',
    status: 'active',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-01-01T00:00:00Z',
    ...overrides,
});

const defaultProps = {
    employees: [] as Employee[],
    isLoading: false,
    sortBy: 'id' as const,
    sortDir: 'asc' as const,
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    onSortChange: vi.fn(),
    onPageChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
};

describe('EmployeeTable', () => {
    it('9.1 shows spinner when loading', () => {
        render(<EmployeeTable {...defaultProps} isLoading={true} />);
        expect(screen.getByText(/Loading employees/i)).toBeDefined();
    });

    it('9.2 shows empty state when no employees', () => {
        render(<EmployeeTable {...defaultProps} />);
        expect(screen.getByText(/No employees found/i)).toBeDefined();
    });

    it('9.3 renders 3 employee rows', () => {
        const employees = [
            makeEmp({ id: 1, fullName: 'Alice' }),
            makeEmp({ id: 2, fullName: 'Bob', email: 'bob@example.com' }),
            makeEmp({ id: 3, fullName: 'Charlie', email: 'charlie@example.com' }),
        ];
        render(<EmployeeTable {...defaultProps} employees={employees} total={3} totalPages={1} />);
        expect(screen.getByText('Alice')).toBeDefined();
        expect(screen.getByText('Bob')).toBeDefined();
        expect(screen.getByText('Charlie')).toBeDefined();
    });

    it('9.4 clicking sortable column calls onSortChange', () => {
        const onSortChange = vi.fn();
        render(
            <EmployeeTable
                {...defaultProps}
                employees={[makeEmp()]}
                total={1}
                totalPages={1}
                onSortChange={onSortChange}
            />,
        );
        fireEvent.click(screen.getByText(/Salary/i));
        expect(onSortChange).toHaveBeenCalledWith('salary');
    });

    it('9.5 clicking delete shows the employee row delete button', () => {
        const onDelete = vi.fn();
        render(
            <EmployeeTable
                {...defaultProps}
                employees={[makeEmp()]}
                total={1}
                totalPages={1}
                onDelete={onDelete}
            />,
        );
        const btn = screen.getByLabelText(/Delete Alice Smith/i);
        fireEvent.click(btn);
        expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('9.6 next page button calls onPageChange', () => {
        const onPageChange = vi.fn();
        render(
            <EmployeeTable
                {...defaultProps}
                employees={[makeEmp()]}
                total={40}
                totalPages={2}
                page={1}
                onPageChange={onPageChange}
            />,
        );
        fireEvent.click(screen.getByLabelText('Next page'));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('9.7 next button disabled on last page', () => {
        render(
            <EmployeeTable
                {...defaultProps}
                employees={[makeEmp()]}
                total={1}
                totalPages={1}
                page={1}
            />,
        );
        expect((screen.getByLabelText('Next page') as HTMLButtonElement).disabled).toBe(true);
    });
});
