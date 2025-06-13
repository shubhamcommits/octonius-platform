import { Request, Response } from 'express'
import { appLogger } from '../logger'

interface RequestWithTimer extends Request {
    startTime: number
}

/**
 * Sends a standardized success response
 * @param req - Express request object
 * @param res - Express response object
 * @param status_code - HTTP status code
 * @param data - Response data
 * @returns Express response
 */
export const sendResponse = (req: RequestWithTimer, res: Response, status_code: number, data: any): Response => {
    
    // Calculate response time
    const response_time = Date.now() - req.startTime

    // Log the success
    appLogger('Request successful', {
        method: req.method,
        path: req.path,
        status_code,
        response_time: `${response_time}ms`
    })

    // Return success response
    return res.status(status_code).json({
        ...data,
        meta: {
            ...data.meta,
            response_time: `${response_time}ms`
        }
    })
}

/**
 * Sends a standardized validation error response
 * @param res - Express response object
 * @param errors - Array of validation errors
 * @returns Express response
 */
export const sendValidationError = (res: Response, errors: any[]): Response => {
    
    // Log the validation error
    appLogger('Validation error', {
        errors,
        level: 'warn'
    })

    // Return validation error response
    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        meta: {
            response_time: '0ms'
        }
    })
}

/**
 * Sends a standardized error response
 * @param res - Express response object
 * @param stack - Error stack trace
 * @param message - Error message
 * @param code - HTTP status code
 * @returns Express response
 */
export const sendError = (res: Response, stack: any, message: string, code: number = 500): Response => {
    
    // Log the error
    appLogger('Request failed', {
        stack,
        message,
        code,
        level: 'error'
    })

    // Return error response
    return res.status(code).json({
        success: false,
        message,
        error: stack instanceof Error ? stack.message : 'Unknown error',
        meta: {
            response_time: '0ms'
        }
    })
} 