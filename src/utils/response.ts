import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message = 'Error', statusCode = 500, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static created(res: Response, data: any, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static badRequest(res: Response, message = 'Bad request', errors?: any) {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Not found') {
    return this.error(res, message, 404);
  }
}
