// Import express
import { Request, Response, NextFunction } from 'express'

// Import AuthService
import { AuthService } from './auth.service'

// Import logger
import { appLogger } from '../logger'

// Import response utils
import { sendResponse, sendError, sendValidationError } from '../shared/response.utils'

// Import validators
import { validateParameters, validateJSON } from '../shared/validators'

/**
 * Controller class for handling authentication-related HTTP requests
 */
export class AuthController {

    // AuthService instance
    private readonly auth_service: AuthService

    /**
     * Creates a new instance of AuthController.
     * @param auth_service - The service responsible for authentication logic
     */
    constructor(auth_service: AuthService) {
        this.auth_service = auth_service
    }

    /**
     * Registers a new user (passwordless)
     * @param req - Express request object containing user data
     * @param res - Express response object
     * @param next - Express next function
     * @returns Created user data or error response
     */
    async register(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {

            // Log the request
            appLogger('Registering new user', { method: req.method, path: req.path, ip: req.ip })

            // Get the email from the body
            const { email } = req.body

            // Validate the Data
            let errors: any = validateParameters({ email })

            // Return Status 400 in case of validation errors
            if (errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, errors)
            }

            // Validate the Body
            let body_errors: any = validateJSON(req.body)

            // Throw error in case body if is empty
            if (body_errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, body_errors)
            }

            // Register the user
            const result = await this.auth_service.register(email)
            
            // Return the result
            if (result.success) {

                // Return Status 201
                return sendResponse(req as any, res, 201, {
                    success: true,
                    message: result.message,
                    user: result.data
                })
            } else {

                // Return Status 500
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {

            // Return Status 500
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Initiates login by generating and sending OTP
     * @param req - Express request object containing email
     * @param res - Express response object
     * @param next - Express next function
     * @returns Success or error response
     */
    async request_otp(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {

            // Log the request
            appLogger('Requesting OTP', { method: req.method, path: req.path, ip: req.ip })

            // Get the email from the body
            const { email } = req.body

            // Validate the Data
            let errors: any = validateParameters({ email })

            // Return Status 400 in case of validation errors
            if (errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, errors)
            }

            // Validate the Body
            let body_errors: any = validateJSON(req.body)

            // Throw error in case body if is empty
            if (body_errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, body_errors)
            }

            // Request the OTP
            const result = await this.auth_service.request_otp(email)

            // Return the result
            if (result.success) {

                // Return Status 200
                return sendResponse(req as any, res, 200, {
                    success: true,
                    message: result.message,
                    data: result.data
                })
            } else {

                // Return Status 500
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {

            // Return Status 500
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Verifies OTP and logs in the user
     * @param req - Express request object containing email and otp_code
     * @param res - Express response object
     * @param next - Express next function
     * @returns User data or error response
     */
    async verify_otp(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {

            // Log the request
            appLogger('Verifying OTP', { method: req.method, path: req.path, ip: req.ip })

            // Get the email and otp_code from the body
            const { email, otp } = req.body

            // Validate the Data
            let errors: any = validateParameters({ email, otp })

            // Return Status 400 in case of validation errors
            if (errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, errors)
            }

            // Validate the Body
            let body_errors: any = validateJSON(req.body)

            // Throw error in case body if is empty
            if (body_errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, body_errors)
            }

            // Verify the OTP
            const result = await this.auth_service.verify_otp(email, otp)

            // Return the result
            if (result.success) {

                // Return Status 200
                return sendResponse(req as any, res, 200, {
                    success: true,
                    message: result.message,
                    data: result.data
                })
            } else {

                // Return Status 500
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {

            // Return Status 500
            return sendError(res, error.stack, error.message, error.code)
        }
    }

    /**
     * Sets up initial workplace with admin user
     * @param req - Express request object containing email and workplace_name
     * @param res - Express response object
     * @param next - Express next function
     * @returns Created user and workplace data or error response
     */
    async setup_workplace_and_user(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {

            // Log the request
            appLogger('Setting up workspace and user', { method: req.method, path: req.path, ip: req.ip })

            // Get the email, and workplace_name from the body
            const { email, workplace_name } = req.body

            // Validate the Data
            let errors: any = validateParameters({ email, workplace_name })

            // Return Status 400 in case of validation errors
            if (errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, errors)
            }

            // Validate the Body
            let body_errors: any = validateJSON(req.body)

            // Throw error in case body if is empty
            if (body_errors.length > 0) {

                // Return Status 400
                return sendValidationError(res, body_errors)
            }

            // Setup workplace and user
            const result = await this.auth_service.setup_workplace_and_user(email, workplace_name)

            // Return the result
            if (result.success) {

                // Return Status 201
                return sendResponse(req as any, res, 201, {
                    success: true,
                    message: result.message,
                    user: result.data.user,
                    workplace: result.data.workplace
                })
            } else {

                // Return Status 500
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {

            // Return Status 500
            return sendError(res, error.stack, error.message, error.code)
        }
    }
} 