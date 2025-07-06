// Import express
import { Request, Response, NextFunction } from 'express'

// Import Auth Service
import { AuthService } from './auth.service'

// Import Auth Code
import { AuthCode } from './auth.code'

// Import response helpers
import { sendResponse } from '../shared/handle-response'
import { sendError, sendValidationError } from '../shared/handle-error'

// Import logger
import { appLogger } from '../logger'

// Import validation helpers
import { validateParameters, validateJSON } from '../shared/validators'

// Import IP utility
import { getRealClientIP } from '../shared/ip-utils'

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                uuid: string;
                email: string;
                first_name?: string;
                last_name?: string;
                current_workplace_id?: string;
                avatar_url?: string;
                iat?: number;
                exp?: number;
            }
        }
    }
}

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

            // Get the email from the body and real client IP
            const { email } = req.body

            // Get the real client IP
            const clientIP = getRealClientIP(req)

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

            // Register the user with client IP
            const result = await this.auth_service.register(email, clientIP)
            
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

            // Get the email and otp_code from the body and real client IP
            const { email, otp } = req.body

            // Get the real client IP
            const clientIP = getRealClientIP(req)

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

            // Verify the OTP with client IP
            const result = await this.auth_service.verify_otp(email, otp, clientIP)

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

            // Get the email, and workplace_name from the body and real client IP
            const { email, workplace_name } = req.body

            // Get the real client IP
            const clientIP = getRealClientIP(req)

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

            // Setup workplace and user with client IP
            const result = await this.auth_service.setup_workplace_and_user(email, workplace_name, clientIP)

            // Return the result
            if (result.success) {

                // Return Status 201
                return sendResponse(req as any, res, 201, {
                    success: true,
                    message: result.message,
                    data: {
                        user: result.data.user,
                        workplace: result.data.workplace,
                        access_token: result.data.access_token,
                        refresh_token: result.data.refresh_token
                    }
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
     * Refreshes the access token using the refresh token.
     * @param req - Express request object containing refresh token in body
     * @param res - Express response object
     * @param next - Express next function
     * @returns New access token or error response
     */
    async refresh(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {
            appLogger('Refreshing token', { method: req.method, path: req.path, ip: req.ip });
            const { refresh_token } = req.body;
            if (!refresh_token) {
                return sendValidationError(res, [{ field: 'refresh_token', message: 'Refresh token is required' }]);
            }
            const result = await this.auth_service.refresh(refresh_token);
            if (result.success) {
                return sendResponse(req as any, res, 200, {
                    success: true,
                    message: result.message,
                    data: result.data
                });
            } else {
                return sendError(res, result.stack, result.message, result.code);
            }
        } catch (error: any) {
            return sendError(res, error.stack, error.message, error.code);
        }
    }

    /**
     * Logs out a user by invalidating their session
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     * @returns Success or error response
     */
    async logout(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {
            // Log the request
            appLogger('Logging out user', { method: req.method, path: req.path, ip: req.ip })

            // Get user_id and token from request
            const user_id = req.user?.uuid
            const token = req.headers.authorization?.split(' ')[1]

            if (!user_id || !token) {
                return sendError(res, '', AuthCode.AUTH_TOKEN_MISSING, 401)
            }

            // Call logout service
            const result = await this.auth_service.logout(user_id, token)

            // Return the result
            if (result.success) {
                return sendResponse(req as any, res, 200, {
                    success: true,
                    message: result.message,
                    data: result.data
                })
            } else {
                return sendError(res, result.stack, result.message, result.code)
            }
        } catch (error: any) {
            return sendError(res, error.stack, error.message, error.code)
        }
    }
} 