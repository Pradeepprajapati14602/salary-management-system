import { Router } from 'express';
import type { EmployeeController } from './employee.controller.js';

export function employeeRouter(controller: EmployeeController): Router {
  const r = Router();
  r.get('/', controller.list);
  r.post('/', controller.create);
  r.get('/:id', controller.getById);
  r.put('/:id', controller.put);
  r.patch('/:id', controller.patch);
  r.delete('/:id', controller.remove);
  return r;
}
