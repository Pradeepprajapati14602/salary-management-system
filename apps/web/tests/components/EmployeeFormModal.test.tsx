import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmployeeFormModal } from '../../src/components/employees/EmployeeFormModal.tsx';
import type { Employee } from '@salary-mgmt/shared';

const mockEmployee: Employee = {
    id: 1,
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    jobTitle: 'Engineer',
    department: 'Engineering',
    country: 'India',
    salary: 80000,
    currency: 'USD',
    hireDate: '2022-06-01',
    status: 'active',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-01-01T00:00:00Z',
};

describe('EmployeeFormModal', () => {
    it('9.8 create mode shows empty form with title "Add Employee"', () => {
        render(
            <EmployeeFormModal
                mode="create"
                onSubmit={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        expect(screen.getByRole('heading', { name: 'Add Employee' })).toBeDefined();
        const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('');
    });

    it('9.9 edit mode pre-fills form with employee data', () => {
        render(
            <EmployeeFormModal
                mode="edit"
                employee={mockEmployee}
                onSubmit={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        expect(screen.getByText('Edit Employee')).toBeDefined();
        const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Alice Smith');
    });

    it('9.10 submitting empty form shows validation errors', () => {
        render(
            <EmployeeFormModal mode="create" onSubmit={vi.fn()} onClose={vi.fn()} />,
        );
        fireEvent.click(document.getElementById('modal-submit-btn')!);
        // Errors should appear on required fields
        expect(screen.getAllByText(/required|at least/i).length).toBeGreaterThan(0);
    });

    it('9.11 submit valid form calls onSubmit', () => {
        const onSubmit = vi.fn();
        render(
            <EmployeeFormModal mode="create" onSubmit={onSubmit} onClose={vi.fn()} />,
        );
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jane@test.com' } });
        fireEvent.change(screen.getByLabelText(/Job Title/i), { target: { value: 'Manager' } });
        fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'HR' } });
        fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'USA' } });
        fireEvent.change(screen.getByLabelText(/Salary/i), { target: { value: '60000' } });
        fireEvent.change(screen.getByLabelText(/Hire Date/i), { target: { value: '2023-01-01' } });
        fireEvent.click(screen.getByText('Add Employee', { selector: 'button' }));
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ fullName: 'Jane Doe', salary: 60000 }),
        );
    });

    it('9.12 cancel button calls onClose without submitting', () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        render(
            <EmployeeFormModal mode="create" onSubmit={onSubmit} onClose={onClose} />,
        );
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('9.13 negative salary triggers validation error', () => {
        render(
            <EmployeeFormModal mode="create" onSubmit={vi.fn()} onClose={vi.fn()} />,
        );
        fireEvent.change(screen.getByLabelText(/Salary/i), { target: { value: '-500' } });
        fireEvent.click(screen.getByText('Add Employee', { selector: 'button' }));
        expect(screen.getByText(/positive number/i)).toBeDefined();
    });
});
