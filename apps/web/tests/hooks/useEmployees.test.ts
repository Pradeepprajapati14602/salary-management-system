/// <reference types="vite/client" />

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createTestQueryClient, withQuery } from '../../src/test/queryUtils.js';
import * as api from '../../src/api/employees.api.js';
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
} from '../../src/hooks/useEmployees.js';

describe('useEmployees', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('8.1 initial loading', () => {
    vi.spyOn(api, 'fetchEmployees').mockImplementation(
      () => new Promise(() => {}),
    );
    const { result } = renderHook(() => useEmployees(), {
      wrapper: ({ children }) => withQuery(children),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('8.2 successful fetch', async () => {
    vi.spyOn(api, 'fetchEmployees').mockResolvedValue({
      data: [{ id: 1 }],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });
    const { result } = renderHook(() => useEmployees(), {
      wrapper: ({ children }) => withQuery(children),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ data: [{ id: 1 }] });
  });

  it('8.3 filter change refetches', async () => {
    const spy = vi.spyOn(api, 'fetchEmployees').mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
    });
    const { result, rerender } = renderHook(
      ({ country }: { country?: string }) => useEmployees({ country }),
      {
        initialProps: { country: undefined as string | undefined },
        wrapper: ({ children }) => withQuery(children),
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ country: 'India' });
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy.mock.calls.some((c) => c[0]?.country === 'India')).toBe(true);
  });

  it('8.4 api error', async () => {
    vi.spyOn(api, 'fetchEmployees').mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useEmployees(), {
      wrapper: ({ children }) => withQuery(children),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('fail');
  });
});

describe('useCreateEmployee', () => {
  it('8.5 invalidates on success', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    vi.spyOn(api, 'createEmployee').mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: ({ children }) => withQuery(children, qc),
    });
    await result.current.mutateAsync({});
    expect(spy).toHaveBeenCalled();
  });

  it('8.6 conflict', async () => {
    vi.spyOn(api, 'createEmployee').mockRejectedValue(
      Object.assign(new Error('conflict'), { status: 409 }),
    );
    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: ({ children }) => withQuery(children),
    });
    await expect(result.current.mutateAsync({})).rejects.toThrow();
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteEmployee', () => {
  it('8.7 invalidates on success', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    vi.spyOn(api, 'deleteEmployee').mockResolvedValue();
    const { result } = renderHook(() => useDeleteEmployee(), {
      wrapper: ({ children }) => withQuery(children, qc),
    });
    await result.current.mutateAsync(1);
    expect(spy).toHaveBeenCalled();
  });

  it('8.8 not found', async () => {
    vi.spyOn(api, 'deleteEmployee').mockRejectedValue(
      Object.assign(new Error('nf'), { status: 404 }),
    );
    const { result } = renderHook(() => useDeleteEmployee(), {
      wrapper: ({ children }) => withQuery(children),
    });
    await expect(result.current.mutateAsync(9)).rejects.toThrow();
  });
});
