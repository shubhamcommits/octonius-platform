// Import Response
import { Response } from 'express'

// Import Logger
import logger from '../logger'

// Send Response Function
export function sendResponse(req: any, res: Response, code?: any, data?: any) {

    // Log the response. Assuming the entire 'data' object should be logged.
    logger.info('Info', {
        success: true,
        msg: data.message,
        code: code,
        method: req?.method,
        url: `${req.protocol}://${req.get('host')}${res.req.originalUrl}`,
        headers: req?.headers,
        params: req?.params,
        query: req?.query,
        body: req?.body,
        details: data
    })

    // Prepare the response object by spreading the 'data' object.
    const response = {
        ...data
    }

    // Send the response
    return res.status(code).json(response)
}