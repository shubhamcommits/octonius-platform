// Import resend module
import { Resend } from 'resend'

// Import logger
import { appLogger } from '../../logger'

// Import environment variables
import { getEnv } from '../../config/env'

// Import notification code
import { NotificationCode } from '../notification.code'

// Instantiate the module
export const resend = new Resend(getEnv().RESEND_API_KEY)

/**
 * This function is responsible for sending the emai;
 * @param toEmail 
 * @param fromEmail 
 * @param subject 
 * @param html 
 */
export async function sendMail(data: any, react_template: any) {

    try {

        // Send the email
        await resend.emails.send({
            from: getEnv().RESEND_FROM_EMAIL || '',
            to: [data.email],
            subject: data.subject,
            react: react_template,
        })

        // Log the success
        appLogger(NotificationCode.SEND_EMAIL_SUCCESS, { data })

        // Return the success
        return { success: true, message: NotificationCode.SEND_EMAIL_SUCCESS }

    } catch (error: any) {

        // Log the error
        appLogger(error.message, { error, level: 'error' })

        // Throw the error
        throw { success: false, message: NotificationCode.SEND_EMAIL_FAILURE }

    }
}

/**
 * This function is responsible for computing the email data in template
 * @param template 
 * @param data 
 * @returns 
 */
export async function computeEmailDataInTemplate(name: string, data: any) {
    try {

        // Import the functional name of template
        let temp = await import(`./${name}`)

        // Resolve the template with class
        return temp.default(data)

    } catch (error: any) {

        // Log the error
        appLogger(error.message, { error, level: 'error' })

        // Throw the error
        throw { success: false, message: NotificationCode.SEND_EMAIL_FAILURE }
    }
}