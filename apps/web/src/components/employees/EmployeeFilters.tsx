import { useCallback, useState } from 'react';
import type { EmployeeListQuery } from '@salary-mgmt/shared';
import { IconClose } from '../icons.js';

type Filters = Partial<Pick<EmployeeListQuery, 'search' | 'country' | 'status' | 'jobTitle'>>;

interface EmployeeFiltersProps {
    filters: Filters;
    onFilterChange: (f: Filters) => void;
}

const COUNTRIES = [
    'India', 'USA', 'UK', 'Canada', 'Germany', 'Australia',
    'France', 'Brazil', 'Japan', 'Singapore',
];

export function EmployeeFilters({ filters, onFilterChange }: EmployeeFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search ?? '');

    // Debounce search with 300ms
    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback(
        (val: string) => {
            setSearchValue(val);
            if (timer) clearTimeout(timer);
            const t = setTimeout(() => {
                onFilterChange({ ...filters, search: val || undefined });
            }, 300);
            setTimer(t);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filters, onFilterChange, timer],
    );

    const handleCountry = (v: string) =>
        onFilterChange({ ...filters, country: v || undefined });

    const handleStatus = (v: string) =>
        onFilterChange({ ...filters, status: (v || undefined) as 'active' | 'inactive' | undefined });

    const handleClear = () => {
        setSearchValue('');
        onFilterChange({});
    };

    const hasFilters = !!(filters.search || filters.country || filters.status);

    return (
        <div className="filters" role="search" aria-label="employee filters">
            <div className="filter-field">
                <label className="label" htmlFor="filter-search">Search</label>
                <input
                    id="filter-search"
                    className="input"
                    type="text"
                    placeholder="Search by name…"
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <div className="filter-field">
                <label className="label" htmlFor="filter-country">Country</label>
                <select
                    id="filter-country"
                    className="select"
                    value={filters.country ?? ''}
                    onChange={(e) => handleCountry(e.target.value)}
                >
                    <option value="">All countries</option>
                    {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="filter-field">
                <label className="label" htmlFor="filter-status">Status</label>
                <select
                    id="filter-status"
                    className="select"
                    value={filters.status ?? ''}
                    onChange={(e) => handleStatus(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {hasFilters && (
                <div style={{ alignSelf: 'flex-end' }}>
                    <button id="clear-filters-btn" className="btn btn-ghost btn-sm" onClick={handleClear} type="button">
                        <span className="btn-with-icon" aria-hidden>
                            <IconClose size={14} />
                        </span>
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}
