// Import Auth Model
import { Auth } from '../auths/auth.model'

// Import Token Model
import { Token } from '../auths/token.model'

// Import User Model
import { User } from '../users/user.model'

// Import Express Types
import { NextFunction, Response, Request } from 'express'

// Import Codes
import { AuthCode } from '../auths/auth.code'

// Import Send Error Function
import { sendError } from '../shared/handle-error'

// JWT Module
import jwt from 'jsonwebtoken'

// Import JWT Config
import { getJWTConfig } from '../config/jwt'

// Import Constants
import { DEFAULT_AVATAR_URL } from '../config/constants'

/**
 * This function is responsible for verifying the access token
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Response or calls next()
 */
export const verifyAccessToken = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        // Authorization header is not present on request
        if (!req.headers.authorization) {
            return sendError(res, '', AuthCode.AUTH_HEADER_MISSING, 401)
        }

        // Extract the token from Bearer scheme
        const authHeader = req.headers.authorization
        if (!authHeader.startsWith('Bearer ')) {
            return sendError(res, '', AuthCode.AUTH_TOKEN_INVALID, 401)
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix

        // Token is not present
        if (!token) {
            return sendError(res, '', AuthCode.AUTH_TOKEN_MISSING, 401)
        }

        // Check if token is blacklisted
        const tokenRecord = await Token.findOne({ 
            where: { 
                access_token: token,
                blacklisted: false 
            } 
        })

        // Reject if token was not found or blacklisted
        if (!tokenRecord) {
            return sendError(res, '', AuthCode.AUTH_TOKEN_BLACKLISTED, 401)
        }

        // Check if token is expired
        if (new Date() > tokenRecord.access_expires_at) {
            return sendError(res, '', AuthCode.AUTH_TOKEN_INVALID, 401)
        }

        // Get JWT config
        const jwtConfig = getJWTConfig()

        // Verify the Token
        jwt.verify(token, jwtConfig.accessKey, async (err: any, decoded: any): Promise<Response | void> => {
            if (err || !decoded) {
                return sendError(res, err, AuthCode.AUTH_TOKEN_INVALID, 401)
            }

            try {
                // Fetch complete user information using user_id from token
                const user = await User.findOne({
                    where: { uuid: decoded.user_id },
                    attributes: [
                        'uuid', 
                        'email', 
                        'first_name', 
                        'last_name', 
                        'current_workplace_id', 
                        'avatar_url',
                        'active'
                    ]
                })

                if (!user || user.active === false) {
                    return sendError(res, '', AuthCode.AUTH_USER_SESSION_INVALID, 401)
                }

                // Set user information on request
                req.user = {
                    uuid: user?.uuid,
                    email: user?.email,
                    first_name: user?.first_name,
                    last_name: user?.last_name,
                    current_workplace_id: user?.current_workplace_id,
                    avatar_url: user?.avatar_url || DEFAULT_AVATAR_URL,
                    iat: decoded.iat,
                    exp: decoded.exp
                }

                next()
            } catch (error: any) {
                return sendError(res, error.stack, AuthCode.AUTH_DATABASE_ERROR, 500)
            }
        })

    } catch (error: any) {

        return sendError(res, error.stack, AuthCode.AUTH_USER_SESSION_INVALID, 500)
    }
}

/**
 * This function is responsible for checking if the current user is logged in
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Response or calls next()
 */
export const isLoggedIn = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        // Check if user is set from verifyAccessToken middleware
        if (!req.headers.authorization || !req.user) {
            return sendError(res, '', AuthCode.AUTH_TOKEN_MISSING, 401)
        }

        // Extract token
        const token = req.headers.authorization.split(' ')[1]

        // Find if auth session is active
        const auth = await Auth.findOne({
            where: {
                user_id: req.user.uuid,
                logged_in: true,
                token: token
            }
        })

        // If auth session exists, pass the request
        if (auth) {
            next()
        } else {
            return sendError(res, '', AuthCode.AUTH_USER_SESSION_INVALID, 401)
        }

    } catch (error: any) {
        return sendError(res, error.stack, 'Unauthorized request, Please login to continue!', 500)
    }
}

/**
 * Middleware to check if user has a workplace selected
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Response or calls next()
 */
export const requireWorkplace = async (req: any, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        if (!req.user?.current_workplace_id) {
            return sendError(res, '', 'No workplace selected. Please select a workplace to continue.', 400)
        }
        next()
    } catch (error: any) {
        return sendError(res, error.stack, 'Failed to verify workplace', 500)
    }
} 