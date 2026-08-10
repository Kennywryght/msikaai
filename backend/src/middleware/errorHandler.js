// backend/src/middleware/errorHandler.js
import { logger } from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorId = req.requestId || 'unknown';
  
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: errorId,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    user: req.user?.id,
  });

  // Send appropriate response
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    errorId: errorId,
    ...(isProduction ? {} : { stack: err.stack }),
    ...(err.code ? { code: err.code } : {}),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  const errorId = req.requestId || 'unknown';
  
  logger.warn({
    message: `Route not found: ${req.method} ${req.path}`,
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: errorId,
  });

  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    errorId: errorId,
  });
};

/**
 * Custom AppError class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error class
 */
export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Authentication Error class
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication required', statusCode = 401) {
    super(message, statusCode, 'AUTH_ERROR');
  }
}

/**
 * Forbidden Error class
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', statusCode = 403) {
    super(message, statusCode, 'FORBIDDEN');
  }
}

/**
 * Not Found Error class
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', statusCode = 404) {
    super(message, statusCode, 'NOT_FOUND');
  }
}

/**
 * Rate Limit Error class
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later', statusCode = 429) {
    super(message, statusCode, 'RATE_LIMIT');
  }
}

export default {
  errorHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
};