// Import AuthCode
import { AuthCode } from './auth.code'

/**
 * AuthResponse interface for handling authentication-related HTTP requests
 */
export interface AuthResponse<T> {

    // Success flag
    success: true

    // Message
    message: AuthCode
    code: number
    data: T
}

/**
 * AuthError interface for handling authentication-related HTTP requests
 */
export interface AuthError {
    success: false
    message: AuthCode
    code: number
    stack: Error
} 