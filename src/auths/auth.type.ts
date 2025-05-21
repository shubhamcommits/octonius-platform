import { AuthCode } from './auth.code'

export interface AuthResponse<T> {
    success: true
    message: AuthCode
    code: number
    data: T
}

export interface AuthError {
    success: false
    message: AuthCode
    code: number
    stack: Error
} 