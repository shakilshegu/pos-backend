import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  console.error('Unhandled Error:', err);

  return ApiResponse.error(res, 'Internal server error', 500);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
};
