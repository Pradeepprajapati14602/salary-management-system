import { Router } from 'express';
import type { InsightsController } from './insights.controller.js';

export function insightsRouter(controller: InsightsController): Router {
  const r = Router();
  r.get('/salary-by-country', controller.salaryByCountry);
  r.get('/salary-by-job-title', controller.salaryByJobTitle);
  r.get('/department-breakdown', controller.departmentBreakdown);
  r.get('/salary-distribution', controller.salaryDistribution);
  r.get('/top-earners', controller.topEarners);
  return r;
}
