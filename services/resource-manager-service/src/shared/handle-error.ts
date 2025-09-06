import { Request, Response, NextFunction } from 'express'
import { logger } from './logger'

export interface ErrorResponse {
  success: false
  message: string
  error?: string
  stack?: string
}

export interface ValidationError {
  field: string
  message: string
}

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public errors: ValidationError[]

  constructor(message: string, errors: ValidationError[] = []) {
    super(message, 400)
    this.errors = errors
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409)
  }
}

export const handleError = (error: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500
  let message = 'Internal server error'
  let errorDetails: any = {}

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
    errorDetails = error.errors
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400
    message = 'Database validation error'
    errorDetails = error.errors
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409
    message = 'Duplicate entry'
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400
    message = 'Foreign key constraint error'
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log error
  logger.error('Error occurred', {
    component: 'error-handler',
    statusCode,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    message
  }

  // Add error details in development
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'local') {
    errorResponse.error = error.message
    errorResponse.stack = error.stack
  }

  // Add validation errors if present
  if (errorDetails && Object.keys(errorDetails).length > 0) {
    errorResponse.error = JSON.stringify(errorDetails)
  }

  res.status(statusCode).json(errorResponse)
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export const sendError = (res: Response, error: any, message: string, statusCode: number = 500) => {
  logger.error('Sending error response', {
    component: 'error-handler',
    statusCode,
    message,
    error: error instanceof Error ? error.message : String(error)
  })

  const errorResponse: ErrorResponse = {
    success: false,
    message
  }

  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'local') {
    errorResponse.error = error instanceof Error ? error.message : String(error)
  }

  return res.status(statusCode).json(errorResponse)
}
