import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  useDepartmentBreakdown,
  useSalaryByCountry,
  useSalaryByJobTitle,
  useTopEarners,
} from '../hooks/useInsights.js';
import type { Employee } from '@salary-mgmt/shared';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];

const fmtK = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

const fmtSalary = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function InsightsPage() {
  const [countryFilter, setCountryFilter] = useState<string>('');

  const { data: countryData, isLoading: loadCountry } = useSalaryByCountry();
  const { data: jobData, isLoading: loadJob } = useSalaryByJobTitle(countryFilter || undefined);
  const { data: deptData, isLoading: loadDept } = useDepartmentBreakdown();
  const { data: topEarnersData, isLoading: loadTop } = useTopEarners(10);

  const countries = countryData?.data ?? [];
  const jobs = jobData?.data ?? [];
  const departments = deptData?.data ?? [];
  const topEarners = (topEarnersData?.data ?? []) as Employee[];

  // KPI calculations
  const totalHeadcount = countries.reduce((s, c) => s + c.count, 0);
  const globalAvgSalary = countries.length > 0
    ? countries.reduce((s, c) => s + c.avg * c.count, 0) / (totalHeadcount || 1)
    : 0;
  const uniqueCountries = countries.length;
  const topSalary = topEarners[0]?.salary ?? 0;

  const SkeletonCard = () => (
    <div className="kpi-card">
      <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 30, width: 120 }} />
    </div>
  );

  const loadingKPI = loadCountry || loadTop;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-subtitle">Salary analytics across all 10,000+ employees</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label className="label" htmlFor="insights-country-filter" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Filter by country
          </label>
          <select
            id="insights-country-filter"
            className="select"
            style={{ width: 160 }}
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.country} value={c.country}>{c.country}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {loadingKPI ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <div className="kpi-card">
              <div className="kpi-label">Total Employees</div>
              <div className="kpi-value">{totalHeadcount.toLocaleString()}</div>
              <div className="kpi-sub">Across all departments</div>
            </div>
            <div className="kpi-card" style={{ '--accent': '#22c55e' } as React.CSSProperties}>
              <div className="kpi-label">Avg Salary</div>
              <div className="kpi-value">{fmtSalary(Math.round(globalAvgSalary))}</div>
              <div className="kpi-sub">Global average (active only)</div>
            </div>
            <div className="kpi-card" style={{ '--accent': '#f59e0b' } as React.CSSProperties}>
              <div className="kpi-label">Countries</div>
              <div className="kpi-value">{uniqueCountries}</div>
              <div className="kpi-sub">Active locations</div>
            </div>
            <div className="kpi-card" style={{ '--accent': '#ec4899' } as React.CSSProperties}>
              <div className="kpi-label">Top Salary</div>
              <div className="kpi-value">{fmtSalary(topSalary)}</div>
              <div className="kpi-sub">{topEarners[0]?.jobTitle ?? '—'}</div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        {/* Salary by Country */}
        <div className="chart-card">
          <div className="chart-title">Avg Salary by Country</div>
          {loadCountry ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : countries.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={countries} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3350" />
                <XAxis dataKey="country" tick={{ fill: '#8892a4', fontSize: 12 }} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={fmtK} tick={{ fill: '#8892a4', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2e3350', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(v) => [fmtSalary(Number(v)), 'Avg']}
                />
                <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Breakdown */}
        <div className="chart-card">
          <div className="chart-title">Department Breakdown</div>
          {loadDept ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : departments.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={departments}
                  dataKey="headcount"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                >
                  {departments.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2e3350', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(v, _name, item) => [Number(v), (item as { payload?: { department?: string } }).payload?.department ?? '']}
                />
                <Legend
                  formatter={(v: string) => <span style={{ color: '#e2e8f0', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Salary by Job Title */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-title">
            Avg Salary by Job Title
            {countryFilter && <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>({countryFilter})</span>}
          </div>
          {loadJob ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : jobs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={[...jobs].sort((a, b) => b.avg - a.avg).slice(0, 15)}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 120, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3350" />
                <XAxis type="number" tickFormatter={fmtK} tick={{ fill: '#8892a4', fontSize: 12 }} />
                <YAxis dataKey="jobTitle" type="category" tick={{ fill: '#8892a4', fontSize: 12 }} width={115} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2e3350', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(v) => [fmtSalary(Number(v)), 'Avg Salary']}
                />
                <Bar dataKey="avg" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Earners */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Top Earners</h2>
          <span className="text-muted" style={{ fontSize: 13 }}>Top 10 by salary</span>
        </div>
        {loadTop ? (
          <div className="loading-center"><span className="spinner" /></div>
        ) : (
          <table className="table" role="grid" aria-label="top earners">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Country</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {topEarners.map((emp, i) => (
                <tr key={emp.id}>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: i < 3 ? '#f59e0b' : 'var(--muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {i < 3 ? `${i + 1}` : `#${i + 1}`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{emp.fullName}</td>
                  <td>{emp.jobTitle}</td>
                  <td>{emp.department}</td>
                  <td>{emp.country}</td>
                  <td className="font-mono text-success" style={{ fontWeight: 600 }}>
                    {fmtSalary(emp.salary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
