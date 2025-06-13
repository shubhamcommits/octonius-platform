// Import Modules
import { NotificationCode } from './notification.code'

// Import logger
import { appLogger } from '../logger'

// Import email functions
import { computeEmailDataInTemplate, sendMail } from './emails/email'

export class NotificationService {

    /**
     * This function is responsible for sending out the email
     * @param template_name 
     * @param data 
     * @returns 
     */
    async sendMail(template_name: string, data: any) {
        try {

            // Create rendered template
            let render_template = await computeEmailDataInTemplate(template_name, data)

            // Send email
            let response_data = await sendMail(data, render_template)

            if (response_data.success == true) {

                // Resolve the promise
                return {
                    message: NotificationCode.SEND_EMAIL_SUCCESS
                }
            }

            else {

                // Log the error
                appLogger(response_data.message, { error: response_data, level: 'error' })

                // Throw the error
                throw {
                    stack: NotificationCode.SEND_EMAIL_FAILURE,
                    message: NotificationCode.SEND_EMAIL_FAILURE
                }
            }

        } catch (error: any) {

            // Log the error
            appLogger(error.message, { error })

            // Catch the error and reject the promise
            throw {
                stack: NotificationCode.SEND_EMAIL_CATCH,
                message: NotificationCode.SEND_EMAIL_CATCH
            }
        }
    }

}