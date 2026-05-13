import type { Request, Response, NextFunction } from 'express';
import { EmployeeIdParamSchema } from '@salary-mgmt/shared';
import type { EmployeeService } from './employee.service.js';

export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.listEmployees(req.query);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = EmployeeIdParamSchema.parse(req.params);
      const data = await this.service.getEmployee(id);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.createEmployee(req.body);
      res.status(201).json({ data });
    } catch (e) {
      next(e);
    }
  };

  put = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = EmployeeIdParamSchema.parse(req.params);
      const data = await this.service.updateEmployee(id, req.body, false);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  };

  patch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = EmployeeIdParamSchema.parse(req.params);
      const data = await this.service.updateEmployee(id, req.body, true);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = EmployeeIdParamSchema.parse(req.params);
      await this.service.deleteEmployee(id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  };
}
