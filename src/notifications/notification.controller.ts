// Import express
import { NextFunction, Response, Request } from 'express'

// Import notification service
import { NotificationService } from './notification.service'

// Import logger
import { appLogger } from '../logger'

export class NotificationController {

    /**
    * Send Email Notification Controller
    * @param req 
    * @param res 
    * @param next 
    * @returns 
    */
    async sendEmailNotification(req: Request, res: Response, next: NextFunction) {

        // Calculate response time
        const start_time = Date.now()

        try {

            // Fetch the data from the request body
            let { template_name, data } = req.body

            // Call the Service Function
            let response_data = await new NotificationService().sendMail(template_name, data)

            // Calculate response time
            const response_time = Date.now() - start_time

            // Log the success
            appLogger(response_data.message, {
                response_time: `${response_time}ms`,
                status_code: 200,
                body: req.body
            })

            // Returns success response with created user data
            return res.status(200).json({
                success: true,
                data: response_data,
                meta: {
                    response_time: `${response_time}ms`
                }
            })

        } catch (error: any) {

            // Calculate response time
            const response_time = Date.now() - start_time

            // Logs the error for debugging
            appLogger(error.message, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                response_time: `${response_time}ms`,
                status_code: 500,
                body: req.body,
                level: 'error'
            })

            // Returns error response
            return res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error instanceof Error ? error.message : 'Unknown error',
                meta: {
                    response_time: `${response_time}ms`
                }
            })
        }
    }
}
