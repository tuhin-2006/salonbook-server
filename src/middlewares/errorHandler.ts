import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError";
import { ENV } from "../config/env";

export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  } else if ((err as { name?: string }).name === "CastError") {
    statusCode = 400;
    message = "Resource not found (Invalid ID format)";
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = "Duplicate field value entered";
  } else if ((err as { name?: string }).name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if ((err as { name?: string }).name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if ((err as { name?: string }).name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  } else if (err.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    stack: ENV.NODE_ENV === "development" ? err.stack : undefined,
  });
};
