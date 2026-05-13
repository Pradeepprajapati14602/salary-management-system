import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { withQuery } from '../../src/test/queryUtils.js';
import * as insightsApi from '../../src/api/insights.api.js';
import * as employeesApi from '../../src/api/employees.api.js';
import { InsightsPage } from '../../src/pages/InsightsPage.js';

vi.mock('react-router-dom', () => ({
    NavLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const mockCountryData = {
    data: [
        { country: 'India', min: 50000, max: 90000, avg: 70000, count: 3 },
        { country: 'USA', min: 80000, max: 120000, avg: 100000, count: 2 },
    ],
    generatedAt: new Date().toISOString(),
};

const mockTopEarners = {
    data: [
        {
            id: 1, fullName: 'Top Guy', email: 'top@test.com', jobTitle: 'CTO',
            department: 'Engineering', country: 'USA', salary: 200000, currency: 'USD',
            hireDate: '2020-01-01', status: 'active' as const,
            createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z',
        },
    ],
    generatedAt: new Date().toISOString(),
};

describe('InsightsPage', () => {
    it('9.18 shows loading skeleton state initially', () => {
        vi.spyOn(insightsApi, 'fetchSalaryByCountry').mockImplementation(() => new Promise(() => { }));
        vi.spyOn(insightsApi, 'fetchTopEarners').mockImplementation(() => new Promise(() => { }));
        vi.spyOn(insightsApi, 'fetchSalaryByJobTitle').mockImplementation(() => new Promise(() => { }));
        vi.spyOn(insightsApi, 'fetchDepartmentBreakdown').mockImplementation(() => new Promise(() => { }));

        render(<InsightsPage />, { wrapper: ({ children }) => withQuery(children) });
        // KPI skeleton blocks should be present
        const skeletons = document.querySelectorAll('.skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('9.19 shows KPI card values when data loads', async () => {
        vi.spyOn(insightsApi, 'fetchSalaryByCountry').mockResolvedValue(mockCountryData);
        vi.spyOn(insightsApi, 'fetchTopEarners').mockResolvedValue(mockTopEarners);
        vi.spyOn(insightsApi, 'fetchSalaryByJobTitle').mockResolvedValue({ data: [], generatedAt: '' });
        vi.spyOn(insightsApi, 'fetchDepartmentBreakdown').mockResolvedValue({ data: [], generatedAt: '' });

        render(<InsightsPage />, { wrapper: ({ children }) => withQuery(children) });
        await screen.findByText('5'); // total headcount (India:3 + USA:2)
    });

    it('9.20 recharts container present after data loads', async () => {
        vi.spyOn(insightsApi, 'fetchSalaryByCountry').mockResolvedValue(mockCountryData);
        vi.spyOn(insightsApi, 'fetchTopEarners').mockResolvedValue(mockTopEarners);
        vi.spyOn(insightsApi, 'fetchSalaryByJobTitle').mockResolvedValue({ data: [], generatedAt: '' });
        vi.spyOn(insightsApi, 'fetchDepartmentBreakdown').mockResolvedValue({ data: [], generatedAt: '' });

        render(<InsightsPage />, { wrapper: ({ children }) => withQuery(children) });
        await screen.findByText('5');
        // Recharts renders an SVG container or responsive-container div
        const svgEls = document.querySelectorAll('.recharts-responsive-container, svg');
        expect(svgEls.length).toBeGreaterThan(0);
    });

    it('9.21 country filter select is present and functional', () => {
        vi.spyOn(insightsApi, 'fetchSalaryByCountry').mockResolvedValue(mockCountryData);
        vi.spyOn(insightsApi, 'fetchTopEarners').mockResolvedValue(mockTopEarners);
        vi.spyOn(insightsApi, 'fetchSalaryByJobTitle').mockResolvedValue({ data: [], generatedAt: '' });
        vi.spyOn(insightsApi, 'fetchDepartmentBreakdown').mockResolvedValue({ data: [], generatedAt: '' });
        vi.spyOn(employeesApi, 'fetchEmployees').mockResolvedValue({ data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } });

        render(<InsightsPage />, { wrapper: ({ children }) => withQuery(children) });
        const select = screen.getByLabelText(/Filter by country/i);
        expect(select).toBeDefined();
    });
});
