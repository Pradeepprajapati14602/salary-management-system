import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../src/errors/domainErrors.js';

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('errorHandler', () => {
  it('10.1 NotFoundError 404', () => {
    const res = mockRes();
    errorHandler(new NotFoundError('Employee', 5), {} as never, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Employee with id 5 not found',
    });
  });

  it('10.2 ValidationError 400 with details', () => {
    const res = mockRes();
    errorHandler(
      new ValidationError('bad', { x: ['y'] }),
      {} as never,
      res,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'bad',
      details: { x: ['y'] },
    });
  });

  it('10.3 ConflictError 409', () => {
    const res = mockRes();
    errorHandler(
      new ConflictError('Email already exists'),
      {} as never,
      res,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email already exists',
    });
  });

  it('10.4 generic Error 500', () => {
    const res = mockRes();
    errorHandler(new Error('secret'), {} as never, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('10.5 ZodError 400', () => {
    const res = mockRes();
    const parsed = z.object({ email: z.string().email() }).safeParse({
      email: 'bad',
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) throw new Error('expected fail');
    errorHandler(parsed.error, {} as never, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.objectContaining({
          email: expect.arrayContaining(['Invalid email']),
        }),
      }),
    );
  });
});
