import { describe, expect, it } from 'vitest';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from '@salary-mgmt/shared';

const base = {
  fullName: 'John Doe',
  email: 'john@example.com',
  jobTitle: 'Engineer',
  department: 'Engineering',
  country: 'India',
  salary: 75_000,
  currency: 'USD',
  hireDate: '2020-01-15T00:00:00.000Z',
  status: 'active' as const,
};

describe('CreateEmployeeSchema', () => {
  it('1.1 valid complete employee object passes', () => {
    const r = CreateEmployeeSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('1.2 fullName empty fails min(2)', () => {
    const r = CreateEmployeeSchema.safeParse({ ...base, fullName: '' });
    expect(r.success).toBe(false);
  });

  it('1.3 fullName 151 chars fails max(150)', () => {
    const r = CreateEmployeeSchema.safeParse({
      ...base,
      fullName: 'a'.repeat(151),
    });
    expect(r.success).toBe(false);
  });

  it('1.4 email missing @ fails', () => {
    const r = CreateEmployeeSchema.safeParse({ ...base, email: 'notanemail' });
    expect(r.success).toBe(false);
  });

  it('1.5 salary 0 fails positive', () => {
    const r = CreateEmployeeSchema.safeParse({ ...base, salary: 0 });
    expect(r.success).toBe(false);
  });

  it('1.6 salary negative fails', () => {
    const r = CreateEmployeeSchema.safeParse({ ...base, salary: -500 });
    expect(r.success).toBe(false);
  });

  it('1.7 salary over max fails', () => {
    const r = CreateEmployeeSchema.safeParse({
      ...base,
      salary: 10_000_001,
    });
    expect(r.success).toBe(false);
  });

  it('1.8 country missing fails', () => {
    const { country: _, ...rest } = base;
    const r = CreateEmployeeSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it('1.9 jobTitle whitespace only fails after trim', () => {
    const r = CreateEmployeeSchema.safeParse({ ...base, jobTitle: '   ' });
    expect(r.success).toBe(false);
  });

  it('1.10 hireDate not-a-date fails', () => {
    const r = CreateEmployeeSchema.safeParse({
      ...base,
      hireDate: 'not-a-date',
    });
    expect(r.success).toBe(false);
  });

  it('1.11 status terminated fails enum', () => {
    const r = CreateEmployeeSchema.safeParse({
      ...base,
      status: 'terminated',
    });
    expect(r.success).toBe(false);
  });

  it('1.12 status omitted defaults active', () => {
    const { status: _, ...rest } = base;
    const r = CreateEmployeeSchema.parse(rest);
    expect(r.status).toBe('active');
  });

  it('1.13 currency omitted defaults USD', () => {
    const { currency: _, ...rest } = base;
    const r = CreateEmployeeSchema.parse(rest);
    expect(r.currency).toBe('USD');
  });

  it('1.14 currency USDX length fails', () => {
    const r = CreateEmployeeSchema.safeParse({ ...base, currency: 'USDX' });
    expect(r.success).toBe(false);
  });
});

describe('UpdateEmployeeSchema', () => {
  it('1.15 empty object passes', () => {
    const r = UpdateEmployeeSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('1.16 salary -1 fails', () => {
    const r = UpdateEmployeeSchema.safeParse({ salary: -1 });
    expect(r.success).toBe(false);
  });

  it('1.17 valid email partial passes', () => {
    const r = UpdateEmployeeSchema.safeParse({ email: 'valid@test.com' });
    expect(r.success).toBe(true);
  });
});
