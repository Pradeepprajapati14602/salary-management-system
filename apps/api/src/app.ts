import express from 'express';
import cors from 'cors';
import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './db/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { EmployeeRepository } from './modules/employees/employee.repository.js';
import { EmployeeService } from './modules/employees/employee.service.js';
import { EmployeeController } from './modules/employees/employee.controller.js';
import { employeeRouter } from './modules/employees/employee.router.js';
import { InsightsRepository } from './modules/insights/insights.repository.js';
import { InsightsService } from './modules/insights/insights.service.js';
import { InsightsController } from './modules/insights/insights.controller.js';
import { insightsRouter } from './modules/insights/insights.router.js';

export function createApp(prisma: PrismaClient = getPrismaClient()): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  const employeeRepo = new EmployeeRepository(prisma);
  const employeeService = new EmployeeService(employeeRepo);
  const employeeController = new EmployeeController(employeeService);

  const insightsRepo = new InsightsRepository(prisma);
  const insightsService = new InsightsService(insightsRepo);
  const insightsController = new InsightsController(insightsService);

  app.use('/api/employees', employeeRouter(employeeController));
  app.use('/api/insights', insightsRouter(insightsController));

  app.use(errorHandler);
  return app;
}
