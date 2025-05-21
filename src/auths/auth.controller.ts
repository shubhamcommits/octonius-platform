import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import logger from '../logger'

/**
 * Controller class for handling authentication-related HTTP requests (OTP-based, passwordless)
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
     * @returns Created user data or error response
     */
    async register(req: Request, res: Response): Promise<Response> {
        const start_time = Date.now()
        try {
            logger.info('Registering new user', { method: req.method, path: req.path, ip: req.ip })
            const { email } = req.body
            const result = await this.auth_service.register(email)
            const response_time = Date.now() - start_time
            if (result.success) {
                logger.info('User registered', { email, response_time: `${response_time}ms`, status_code: 201 })
                return res.status(201).json({ success: true, data: result.data, message: result.message, meta: { response_time: `${response_time}ms` } })
            } else {
                logger.warn('Registration failed', { email, response_time: `${response_time}ms`, status_code: result.code })
                return res.status(result.code).json({ success: false, message: result.message, error: result.stack.message, meta: { response_time: `${response_time}ms` } })
            }
        } catch (error) {
            const response_time = Date.now() - start_time
            logger.error('Error in register controller', { error, response_time: `${response_time}ms` })
            return res.status(500).json({ success: false, message: 'Failed to register', error, meta: { response_time: `${response_time}ms` } })
        }
    }

    /**
     * Initiates login by generating and sending OTP
     * @param req - Express request object containing email
     * @param res - Express response object
     * @returns Success or error response
     */
    async request_otp(req: Request, res: Response): Promise<Response> {
        const start_time = Date.now()
        try {
            logger.info('Requesting OTP', { method: req.method, path: req.path, ip: req.ip })
            const { email } = req.body
            const result = await this.auth_service.request_otp(email)
            const response_time = Date.now() - start_time
            if (result.success) {
                logger.info('OTP sent', { email, response_time: `${response_time}ms`, status_code: 200 })
                return res.status(200).json({ success: true, message: result.message, meta: { response_time: `${response_time}ms` } })
            } else {
                logger.warn('OTP request failed', { email, response_time: `${response_time}ms`, status_code: result.code })
                return res.status(result.code).json({ success: false, message: result.message, error: result.stack.message, meta: { response_time: `${response_time}ms` } })
            }
        } catch (error) {
            const response_time = Date.now() - start_time
            logger.error('Error in request_otp controller', { error, response_time: `${response_time}ms` })
            return res.status(500).json({ success: false, message: 'Failed to request OTP', error, meta: { response_time: `${response_time}ms` } })
        }
    }

    /**
     * Verifies OTP and logs in the user
     * @param req - Express request object containing email and otp_code
     * @param res - Express response object
     * @returns User data or error response
     */
    async verify_otp(req: Request, res: Response): Promise<Response> {
        const start_time = Date.now()
        try {
            logger.info('Verifying OTP', { method: req.method, path: req.path, ip: req.ip })
            const { email, otp_code } = req.body
            const result = await this.auth_service.verify_otp(email, otp_code)
            const response_time = Date.now() - start_time
            if (result.success) {
                logger.info('OTP verified', { email, response_time: `${response_time}ms`, status_code: 200 })
                return res.status(200).json({ success: true, data: result.data, message: result.message, meta: { response_time: `${response_time}ms` } })
            } else {
                logger.warn('OTP verification failed', { email, response_time: `${response_time}ms`, status_code: result.code })
                return res.status(result.code).json({ success: false, message: result.message, error: result.stack.message, meta: { response_time: `${response_time}ms` } })
            }
        } catch (error) {
            const response_time = Date.now() - start_time
            logger.error('Error in verify_otp controller', { error, response_time: `${response_time}ms` })
            return res.status(500).json({ success: false, message: 'Failed to verify OTP', error, meta: { response_time: `${response_time}ms` } })
        }
    }
} 