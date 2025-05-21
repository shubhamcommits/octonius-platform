// Import Codes
import { UserCode } from './user.code'

/**
 * Interface for successful responses
 */
export interface UserResponse<T> {
    success: true
    message: UserCode
    code: number
    user: T
}

/**
 * Interface for successful responses
 */
export interface UsersResponse<T> {
    success: true
    message: UserCode
    code: number
    users: T
}

/**
 * Interface for error responses
 */
export interface UserError {
    success: false
    message: UserCode
    code: number
    stack: Error
} 