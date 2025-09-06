import { Request, Response } from 'express'
import { logger } from './logger'

export interface SuccessResponse<T = any> {
  success: true
  message: string
  data?: T
  metadata?: {
    total_count?: number
    page_number?: number
    total_pages?: number
    page_size?: number
  }
}

export const sendResponse = <T>(
  req: Request, 
  res: Response, 
  statusCode: number, 
  data: {
    message: string
    data?: T
    metadata?: {
      total_count?: number
      page_number?: number
      total_pages?: number
      page_size?: number
    }
  }
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message: data.message,
    data: data.data,
    metadata: data.metadata
  }

  logger.info('Sending success response', {
    component: 'response-handler',
    statusCode,
    message: data.message,
    url: req.url,
    method: req.method
  })

  return res.status(statusCode).json(response)
}

export const sendValidationError = (res: Response, errors: any[]): Response => {
  logger.error('Sending validation error', {
    component: 'response-handler',
    errors: errors.length
  })

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.map(error => ({
      code: error.code || 'validation/unknown',
      message: error.message
    }))
  })
}
