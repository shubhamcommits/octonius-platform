// Import Auth model
import Auth from './auth.model'
// Import User model
import { User } from '../users/user.model'
// Import response and error types
import { AuthResponse, AuthError } from './auth.type'
// Import AuthCode enum
import { AuthCode } from './auth.code'
// Import global connection map for Redis
import { global_connection_map } from '../../server'
// Import logger
import logger from '../logger'

/**
 * Service class for handling authentication operations (OTP-based, passwordless)
 */
export class AuthService {
    /**
     * Registers a new user with email (passwordless)
     * @param email - User's email address
     * @returns AuthResponse or AuthError
     */
    async register(email: string): Promise<AuthResponse<User> | AuthError> {
        try {
            // Check if user already exists
            const existing = await User.findOne({ where: { email } })
            if (existing) {
                return {
                    success: false,
                    message: AuthCode.AUTH_EMAIL_EXISTS,
                    code: 409,
                    stack: new Error('Email already exists')
                }
            }
            // Create the user with required fields and sensible defaults
            const user = await User.create({
                email,
                phone: '0000000000', // Default phone, should be updated later
                timezone: 'UTC',
                language: 'en',
                notification_preferences: { email: true, push: true, in_app: true },
                source: 'email',
                active: true
            })
            // Create an auth record for the user (OTP logic to be added)
            await Auth.create({
                user_id: user.uuid,
                token: '',
                refresh_token: '',
                last_login: new Date(),
                created_date: new Date(),
                logged_in: false
            })
            return {
                success: true,
                message: AuthCode.AUTH_REGISTERED,
                code: 201,
                data: user
            }
        } catch (error) {
            return {
                success: false,
                message: AuthCode.AUTH_DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Initiates login by generating and sending OTP
     * @param email - User's email address
     * @returns AuthResponse or AuthError
     */
    async request_otp(email: string): Promise<AuthResponse<null> | AuthError> {
        try {
            // Check if user exists
            const user = await User.findOne({ where: { email } })
            if (!user) {
                return {
                    success: false,
                    message: AuthCode.AUTH_INVALID_CREDENTIALS,
                    code: 404,
                    stack: new Error('User not found')
                }
            }
            // Generate a 6-digit OTP
            const otp_code = Math.floor(100000 + Math.random() * 900000).toString()
            // Store OTP in Redis with 5 min expiry
            const redis: any = global_connection_map.get('redis')
            await redis.set(`otp:${email}`, otp_code, 'EX', 300)
            logger.info(`OTP generated and stored in Redis for ${email}`)
            // TODO: Send OTP via Resend here
            return {
                success: true,
                message: AuthCode.AUTH_LOGGED_IN,
                code: 200,
                data: null
            }
        } catch (error) {
            return {
                success: false,
                message: AuthCode.AUTH_DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Verifies OTP and logs in the user
     * @param email - User's email address
     * @param otp_code - The OTP code to verify
     * @returns AuthResponse or AuthError
     */
    async verify_otp(email: string, otp_code: string): Promise<AuthResponse<User> | AuthError> {
        try {
            // Check if user exists
            const user = await User.findOne({ where: { email } })
            if (!user) {
                return {
                    success: false,
                    message: AuthCode.AUTH_INVALID_CREDENTIALS,
                    code: 404,
                    stack: new Error('User not found')
                }
            }
            // Fetch OTP from Redis
            const redis: any = global_connection_map.get('redis')
            const stored_otp = await redis.get(`otp:${email}`)
            if (!stored_otp || stored_otp !== otp_code) {
                return {
                    success: false,
                    message: AuthCode.AUTH_INVALID_CREDENTIALS,
                    code: 401,
                    stack: new Error('Invalid or expired OTP')
                }
            }
            // OTP is valid, delete it from Redis
            await redis.del(`otp:${email}`)
            logger.info(`OTP verified and deleted from Redis for ${email}`)
            // Mark user as logged in (update Auth record)
            await Auth.upsert({
                user_id: user.uuid,
                token: '',
                refresh_token: '',
                last_login: new Date(),
                logged_in: true
            })
            return {
                success: true,
                message: AuthCode.AUTH_LOGGED_IN,
                code: 200,
                data: user
            }
        } catch (error) {
            return {
                success: false,
                message: AuthCode.AUTH_DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }
}

export default new AuthService() 