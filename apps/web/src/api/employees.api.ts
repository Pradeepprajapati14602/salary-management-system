import type { EmployeeListQuery } from '@salary-mgmt/shared';

const base = import.meta.env.VITE_API_URL ?? '';

export async function fetchEmployees(
  filters: Partial<EmployeeListQuery> = {},
): Promise<unknown> {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '') p.set(k, String(v));
  }
  const q = p.toString();
  const res = await fetch(`${base}/api/employees${q ? `?${q}` : ''}`);
  if (!res.ok) {
    const err = new Error(await res.text());
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json();
}

export async function createEmployee(body: unknown): Promise<unknown> {
  const res = await fetch(`${base}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(await res.text());
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json();
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`${base}/api/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = new Error(await res.text());
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
}
