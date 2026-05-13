import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmployeeFilters } from '../../src/components/employees/EmployeeFilters.tsx';

describe('EmployeeFilters', () => {
    it('9.14 typing in search box calls onFilterChange with search value (after debounce)', async () => {
        vi.useFakeTimers();
        const onFilterChange = vi.fn();
        render(<EmployeeFilters filters={{}} onFilterChange={onFilterChange} />);
        const input = screen.getByPlaceholderText(/Search by name/i);
        fireEvent.change(input, { target: { value: 'John' } });
        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'John' }));
        vi.useRealTimers();
    });

    it('9.15 rapid typing debounces — onFilterChange called once', async () => {
        vi.useFakeTimers();
        const onFilterChange = vi.fn();
        render(<EmployeeFilters filters={{}} onFilterChange={onFilterChange} />);
        const input = screen.getByPlaceholderText(/Search by name/i);
        fireEvent.change(input, { target: { value: 'J' } });
        fireEvent.change(input, { target: { value: 'Jo' } });
        fireEvent.change(input, { target: { value: 'Joh' } });
        fireEvent.change(input, { target: { value: 'John' } });
        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        // Only 1 call after debounce settles
        expect(onFilterChange).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('9.16 selecting country calls onFilterChange with country value', () => {
        const onFilterChange = vi.fn();
        render(<EmployeeFilters filters={{}} onFilterChange={onFilterChange} />);
        const select = screen.getByLabelText(/Country/i);
        fireEvent.change(select, { target: { value: 'India' } });
        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ country: 'India' }));
    });

    it('9.17 clear all filters resets to empty object', async () => {
        vi.useFakeTimers();
        const onFilterChange = vi.fn();
        render(
            <EmployeeFilters
                filters={{ search: 'John', country: 'India', status: 'active' }}
                onFilterChange={onFilterChange}
            />,
        );
        fireEvent.click(screen.getByText(/Clear/i));
        expect(onFilterChange).toHaveBeenCalledWith({});
        vi.useRealTimers();
    });
});
