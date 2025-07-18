// Import Auth model
import { Auth } from './auth.model'

// Import User model
import { User } from '../users/user.model'

// Import User service
import { UserService } from '../users/user.service'

// Import Workplace model
import { Workplace } from '../workplaces/workplace.model'

// Import WorkplaceMembership model
import { WorkplaceMembership } from '../workplaces/workplace-membership.model'

// Import Role model
import { Role } from '../roles/role.model'

// Import Role service
import RoleService from '../roles/role.service'

// Import response and error types
import { AuthResponse, AuthError } from './auth.type'

// Import AuthCode enum
import { AuthCode } from './auth.code'

// Import global connection map for Redis
import { global_connection_map } from '../../server'

// Import logger
import logger from '../logger'

// Import NotificationService
import { NotificationService } from '../notifications'

// Import TokenService
import { TokenService } from './token.service'

// Import jwt
import jwt, { SignOptions } from 'jsonwebtoken'

// Import Token model
import { Token } from './token.model'

// Import IP utility
import { getRealClientIP } from '../shared/ip-utils'

/**
 * Service class for handling authentication operations (OTP-based, passwordless)
 */
export class AuthService {
    private userService = new UserService();

    /**
     * Registers a new user with email (passwordless)
     * @param email - User's email address
     * @param ipAddress - Client IP address
     * @returns AuthResponse or AuthError
     */
    async register(email: string, ipAddress?: string): Promise<AuthResponse<User> | AuthError> {
        try {

            // Check if user already exists
            const existing = await User.findOne({ where: { email } })

            // Return error if user already exists
            if (existing) {
                return {
                    success: false,
                    message: AuthCode.AUTH_EMAIL_EXISTS,
                    code: 409,
                    stack: new Error('Email already exists')
                }
            }

            // Create the user using UserService to ensure proper setup (including private group)
            const userResponse = await this.userService.create({
                email,
                first_name: null,
                last_name: null,
                role_id: null, // Will be set later
                phone: null,
                timezone: 'UTC',
                language: 'en',
                notification_preferences: { email: true, push: true, in_app: true },
                source: 'email',
                active: true
            })

            if (!userResponse.success) {
                return {
                    success: false,
                    message: AuthCode.AUTH_DATABASE_ERROR,
                    code: 500,
                    stack: new Error('Failed to create user')
                }
            }

            const user = userResponse.user

            // Create an auth record for the user (OTP logic to be added)
            await Auth.create({
                user_id: user.uuid,
                token: '',
                refresh_token: '',
                last_login: new Date(),
                created_date: new Date(),
                logged_in: false,
                ip_address: ipAddress || null
            })

            // Return success response
            return {
                success: true,
                message: AuthCode.AUTH_REGISTERED,
                code: 201,
                data: user
            }
        } catch (error) {

            // Return error response
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
    async request_otp(email: string): Promise<AuthResponse<{ exists: boolean }> | AuthError> {
        try {

            // Check if user exists
            const user = await User.findOne({ where: { email } })

            // Generate OTP
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

            // Generate OTP
            let otp_code = ''

            // Generate OTP
            for (let i = 0; i < 6; i++) {
                const random_index = Math.floor(Math.random() * characters.length)
                otp_code += characters[random_index]
            }

            // Store OTP in Redis with 5 min expiry
            const redis: any = global_connection_map.get('redis')

            // Store OTP in Redis
            await redis.set(`otp:${email}`, otp_code, 'EX', 300)

            // Log the OTP
            logger.info(`OTP generated and stored in Redis for ${email}`)

            // Send OTP via Resend
            await new NotificationService()
                .sendMail(`send_otp_details`, {
                    subject: "Welcome to Octonius",
                    email: email,
                    otp: otp_code
                })

            // Return success response
            return {
                success: true,
                message: AuthCode.AUTH_OTP_REQUESTED,
                code: 200,
                data: { exists: user ? true : false }
            }
        } catch (error) {

            // Return error response
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
     * @param otp - The OTP code to verify
     * @param ipAddress - Client IP address
     * @returns AuthResponse or AuthError
     */
    async verify_otp(email: string, otp: string, ipAddress?: string): Promise<AuthResponse<{ exists: boolean, user: any, access_token?: string, refresh_token?: string }> | AuthError> {
        try {
            // Check if user exists
            const user = await User.findOne({ where: { email } })

            // Fetch OTP from Redis
            const redis: any = global_connection_map.get('redis')
            const stored_otp = await redis.get(`otp:${email}`)

            // Return error if OTP is invalid or expired
            if (!stored_otp || stored_otp !== otp) {
                return {
                    success: false,
                    message: AuthCode.AUTH_INVALID_CREDENTIALS,
                    code: 401,
                    stack: new Error('Invalid or expired OTP')
                }
            }

            // Delete OTP from Redis
            await redis.del(`otp:${email}`)

            // Log OTP verification
            logger.info(`OTP verified and deleted from Redis for ${email}`)

            // Mark user as logged in (update Auth record)
            if (user) {
                // Generate access and refresh tokens
                const { access_token, refresh_token } = TokenService.generate_tokens(user)

                // Decode expiry from tokens
                const access_decoded: any = TokenService.verify_access_token(access_token)
                const refresh_decoded: any = TokenService.verify_refresh_token(refresh_token)
                const access_expires_at = new Date(access_decoded.exp * 1000)
                const refresh_expires_at = new Date(refresh_decoded.exp * 1000)

                // Update Auth record with tokens
                await Auth.upsert({
                    user_id: user.uuid,
                    token: access_token,
                    refresh_token: refresh_token,
                    last_login: new Date(),
                    logged_in: true,
                    ip_address: ipAddress || null
                })

                // Save tokens in Token table
                await TokenService.save_tokens(
                    user.uuid,
                    access_token,
                    refresh_token,
                    access_expires_at,
                    refresh_expires_at
                )

                // Return success response with tokens
                return {
                    success: true,
                    message: AuthCode.AUTH_OTP_VERIFIED,
                    code: 200,
                    data: {
                        exists: true,
                        user: user,
                        access_token: access_token,
                        refresh_token: refresh_token
                    }
                }
            }

            // Return success response (user not found)
            return {
                success: true,
                message: AuthCode.AUTH_OTP_VERIFIED,
                code: 200,
                data: {
                    exists: false,
                    user: null
                }
            }
        } catch (error) {
            // Return error response
            return {
                success: false,
                message: AuthCode.AUTH_DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Sets up initial workplace with admin user
     * @param email - User's email address
     * @param workplace_name - Name of the workplace to create
     * @param ipAddress - Client IP address
     * @returns AuthResponse with user and workplace data
     */
    async setup_workplace_and_user(email: string, workplace_name: string, ipAddress?: string): Promise<AuthResponse<{ user: User, workplace: Workplace, access_token: string, refresh_token: string }> | AuthError> {
        try {

            // Check if user already exists
            let user = await User.findOne({ where: { email } })

            // If user does not exist, create it
            if (!user) {

                // Create the user using UserService to ensure proper setup (including private group)
                const userResponse = await this.userService.create({
                    email,
                    first_name: null,
                    last_name: null,
                    role_id: null, // Will be set later
                    phone: null,
                    timezone: 'UTC',
                    language: 'en',
                    notification_preferences: { email: true, push: true, in_app: true },
                    source: 'email',
                    active: true
                    // current_workplace_id will be set after workplace creation
                })

                if (!userResponse.success) {
                    throw new Error('Failed to create user')
                }

                user = userResponse.user
            }

            // Create workplace
            const workplace = await Workplace.create({
                name: workplace_name,
                timezone: user.timezone,
                created_by: user.uuid,
                active: true
            })

            // Create default roles for the workplace
            const rolesResult = await RoleService.createDefaultRoles(workplace.uuid, user.uuid)
            if (!rolesResult.success) {
                throw new Error('Failed to create default roles')
            }

            // Find the owner role
            const ownerRole = rolesResult.data?.find((role: Role) => role.name === 'owner')
            if (!ownerRole) {
                throw new Error('Owner role not found')
            }

            // Create workplace membership with owner role
            await WorkplaceMembership.create({
                user_id: user.uuid,
                workplace_id: workplace.uuid,
                role_id: ownerRole.uuid,
                status: 'active',
                joined_at: new Date()
            })

            // Update user's current workplace
            await user.update({ current_workplace_id: workplace.uuid })

            // Ensure private group exists for the user in this workplace
            try {
                await this.userService.ensureUserHasPrivateGroup(user.uuid, workplace.uuid);
                logger.info('Private group ensured for user in new workplace', { 
                    userId: user.uuid, 
                    workplaceId: workplace.uuid 
                });
            } catch (groupError) {
                logger.warn('Failed to ensure private group for user in new workplace', { 
                    userId: user.uuid, 
                    workplaceId: workplace.uuid, 
                    error: groupError 
                });
                // Don't fail the process if private group creation fails
            }

            // Generate authentication tokens for the user to auto-login them
            const { access_token, refresh_token } = TokenService.generate_tokens(user)

            // Decode expiry from tokens
            const access_decoded: any = TokenService.verify_access_token(access_token)
            const refresh_decoded: any = TokenService.verify_refresh_token(refresh_token)
            const access_expires_at = new Date(access_decoded.exp * 1000)
            const refresh_expires_at = new Date(refresh_decoded.exp * 1000)

            // Create/update Auth record with tokens for auto-login
            await Auth.upsert({
                user_id: user.uuid,
                token: access_token,
                refresh_token: refresh_token,
                last_login: new Date(),
                logged_in: true,
                ip_address: ipAddress || null
            })

            // Save tokens in Token table
            await TokenService.save_tokens(
                user.uuid,
                access_token,
                refresh_token,
                access_expires_at,
                refresh_expires_at
            )

            // Return success response with tokens for auto-login
            return {
                success: true,
                message: AuthCode.AUTH_REGISTERED,
                code: 201,
                data: { 
                    user, 
                    workplace,
                    access_token,
                    refresh_token
                }
            }
        } catch (error: any) {
            // Handle unique constraint error for workplace name
            if (error.name === 'SequelizeUniqueConstraintError' && error.errors && error.errors[0]?.path === 'name') {
                return {
                    success: false,
                    message: AuthCode.AUTH_WORKPLACE_NAME_EXISTS,
                    code: 409,
                    stack: error
                }
            }
            // Return error response
            return {
                success: false,
                message: AuthCode.AUTH_DATABASE_ERROR,
                code: 500,
                stack: error instanceof Error ? error : new Error('Database error')
            }
        }
    }

    /**
     * Refreshes the access token using the provided refresh token.
     * @param refresh_token - The refresh token
     * @returns Object containing success status, message, and new access token data
     */
    async refresh(refresh_token: string): Promise<{ success: boolean; message: string; data?: any; code?: number; stack?: string }> {
        try {
            const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
            const accessSecret = process.env.JWT_ACCESS_SECRET as string;
            const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN as string;

            if (!refreshSecret || !accessSecret || !accessExpiresIn) {
                return { success: false, message: 'JWT secrets not configured', code: 500 };
            }

            const decoded = jwt.verify(refresh_token, refreshSecret) as { uuid: string; email: string };
            if (!decoded) {
                return { success: false, message: 'Invalid refresh token', code: 401 };
            }

            const access_token = jwt.sign(
                { uuid: decoded.uuid, email: decoded.email },
                accessSecret,
                { expiresIn: accessExpiresIn } as SignOptions
            )

            return {
                success: true,
                message: 'Token refreshed successfully',
                data: { access_token }
            };
        } catch (error: any) {
            return { success: false, message: error.message, code: 401, stack: error.stack };
        }
    }

    /**
     * Logs out a user by invalidating their session
     * @param user_id - The UUID of the user to logout
     * @param token - The access token to invalidate
     * @returns AuthResponse or AuthError
     */
    async logout(user_id: string, token: string): Promise<AuthResponse<null> | AuthError> {
        try {
            // Find the auth session
            const auth = await Auth.findOne({
                where: {
                    user_id,
                    token,
                    logged_in: true
                }
            })

            if (!auth) {
                return {
                    success: false,
                    message: AuthCode.AUTH_USER_SESSION_INVALID,
                    code: 401,
                    stack: new Error('Invalid session')
                }
            }

            // Update auth record
            await auth.update({
                logged_in: false,
                last_logout: new Date()
            })

            // Blacklist the token
            await Token.update(
                { blacklisted: true },
                { where: { access_token: token } }
            )

            return {
                success: true,
                message: AuthCode.AUTH_LOGOUT_SUCCESS,
                code: 200,
                data: null
            }
        } catch (error: any) {
            return {
                success: false,
                message: AuthCode.AUTH_DATABASE_ERROR,
                code: 500,
                stack: error.stack
            }
        }
    }
}

/**
 * Export the AuthService instance
 */
export default new AuthService() 