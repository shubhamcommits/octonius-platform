// Import express
import { Request, Response, NextFunction } from 'express'

/**
 * Middleware to add start time to request object
 * @param req 
 * @param res 
 * @param next 
 */
export const requestTimer = (req: Request, res: Response, next: NextFunction): void => {

    // Add start time to request object
    (req as any).startTime = Date.now()

    // Continue to next middleware
    next()
} 