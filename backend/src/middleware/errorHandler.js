// backend/src/middleware/errorHandler.js
import { logger } from '../utils/logger.js';

/**
 * Global error handler middleware
 */
const SECRET_KEYS = /pass(word)?|token|secret|otp|code|pin|authorization|card|cvv/i;
const redact = (body) => {
  if (!body || typeof body !== 'object') return body;
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) => [k, SECRET_KEYS.test(k) ? '[redacted]' : v])
  );
};

const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: 'File is too large (max 10 MB)',
  LIMIT_FILE_COUNT: 'Too many files (max 5)',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
};

export const errorHandler = (err, req, res, next) => {
  // Upload problems (multer) are the client's to fix, not server errors.
  if (err?.name === 'MulterError') {
    err.statusCode = 400;
    err.message = UPLOAD_ERRORS[err.code] || err.message;
  }
  const statusCode = err.statusCode || err.status || 500;
  const errorId = req.requestId || 'unknown';
  
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: errorId,
    // Never log credentials: tokens live in headers, passwords in auth bodies.
    body: redact(req.body),
    query: req.query,
    params: req.params,
    userAgent: req.headers?.['user-agent'],
    user: req.user?.id,
  });

  // Send appropriate response
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    success: false,
    // 4xx messages are meant for the user; only hide internals of real failures.
    error: isProduction && statusCode >= 500 ? 'Internal server error' : err.message,
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