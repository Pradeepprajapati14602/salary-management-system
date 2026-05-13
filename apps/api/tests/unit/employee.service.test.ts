import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Employee } from '@salary-mgmt/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../src/errors/domainErrors.js';
import type { IEmployeeRepository } from '../../src/modules/employees/employee.repository.js';
import { EmployeeService } from '../../src/modules/employees/employee.service.js';

const employee: Employee = {
  id: 1,
  fullName: 'A',
  email: 'a@a.com',
  jobTitle: 'Eng',
  department: 'D',
  country: 'India',
  salary: 1,
  currency: 'USD',
  hireDate: '2020-01-01',
  status: 'active',
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('EmployeeService', () => {
  let repo: IEmployeeRepository;
  let service: EmployeeService;

  beforeEach(() => {
    repo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      count: vi.fn(),
    };
    service = new EmployeeService(repo);
  });

  describe('createEmployee', () => {
    it('3.1 valid payload calls repo.create', async () => {
      vi.mocked(repo.create).mockResolvedValue(employee);
      const payload = {
        fullName: 'Jane',
        email: 'j@j.com',
        jobTitle: 'Engineer',
        department: 'Engineering',
        country: 'USA',
        salary: 50_000,
        hireDate: '2021-06-01T00:00:00.000Z',
      };
      const r = await service.createEmployee(payload);
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(r).toEqual(employee);
    });

    it('3.2 duplicate email maps to ConflictError', async () => {
      vi.mocked(repo.create).mockRejectedValue({ code: '23505' });
      await expect(
        service.createEmployee({
          fullName: 'Jane',
          email: 'dup@dup.com',
          jobTitle: 'Engineer',
          department: 'Engineering',
          country: 'USA',
          salary: 50_000,
          hireDate: '2021-06-01T00:00:00.000Z',
        }),
      ).rejects.toMatchObject({
        name: 'ConflictError',
        message: 'Email already exists',
      });
    });

    it('3.3 invalid payload throws ValidationError, repo not called', async () => {
      await expect(service.createEmployee({})).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('getEmployee', () => {
    it('3.4 existing id returns employee', async () => {
      vi.mocked(repo.findById).mockResolvedValue(employee);
      await expect(service.getEmployee(1)).resolves.toEqual(employee);
    });

    it('3.5 missing id throws NotFoundError', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.getEmployee(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('listEmployees', () => {
    it('3.6 default params include active status', async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      });
      await service.listEmployees({});
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          status: 'active',
        }),
      );
    });

    it('3.7 custom page forwarded', async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 2, pageSize: 5, totalPages: 0 },
      });
      await service.listEmployees({ page: '2', pageSize: '5' });
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 5 }),
      );
    });

    it('3.8 pageSize capped at 100', async () => {
      vi.mocked(repo.findAll).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, pageSize: 100, totalPages: 0 },
      });
      await service.listEmployees({ pageSize: '500' });
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 100 }),
      );
    });
  });

  describe('updateEmployee', () => {
    it('3.9 partial update calls repo.update', async () => {
      vi.mocked(repo.findById).mockResolvedValue(employee);
      vi.mocked(repo.update).mockResolvedValue({ ...employee, salary: 2 });
      const r = await service.updateEmployee(1, { salary: 2 }, true);
      expect(repo.update).toHaveBeenCalled();
      expect(r.salary).toBe(2);
    });

    it('3.10 missing employee throws NotFoundError', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(
        service.updateEmployee(1, { salary: 2 }, true),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('3.11 invalid salary throws ValidationError before repo', async () => {
      vi.mocked(repo.findById).mockResolvedValue(employee);
      await expect(
        service.updateEmployee(1, { salary: -1 }, true),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteEmployee', () => {
    it('3.12 existing calls softDelete', async () => {
      vi.mocked(repo.findById).mockResolvedValue(employee);
      vi.mocked(repo.softDelete).mockResolvedValue(true);
      await service.deleteEmployee(1);
      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });

    it('3.13 missing throws NotFoundError', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);
      await expect(service.deleteEmployee(1)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
