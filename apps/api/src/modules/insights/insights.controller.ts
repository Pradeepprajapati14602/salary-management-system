import type { Request, Response, NextFunction } from 'express';
import type { InsightsService } from './insights.service.js';

export class InsightsController {
  constructor(private readonly service: InsightsService) {}

  salaryByCountry = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = await this.service.salaryByCountry();
      res.json(body);
    } catch (e) {
      next(e);
    }
  };

  salaryByJobTitle = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = await this.service.salaryByJobTitle(req.query);
      res.json(body);
    } catch (e) {
      next(e);
    }
  };

  departmentBreakdown = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = await this.service.departmentBreakdown();
      res.json(body);
    } catch (e) {
      next(e);
    }
  };

  salaryDistribution = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = await this.service.salaryDistribution(req.query);
      res.json(body);
    } catch (e) {
      next(e);
    }
  };

  topEarners = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = await this.service.topEarners(req.query);
      res.json(body);
    } catch (e) {
      next(e);
    }
  };
}
