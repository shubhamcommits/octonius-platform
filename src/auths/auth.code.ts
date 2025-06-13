/**
 * Enum containing auth-related status codes and messages
 */
export enum AuthCode {

    // Success codes (2xx)
    AUTH_REGISTERED = 'User has been successfully registered',
    AUTH_OTP_REQUESTED = 'OTP has been successfully requested',
    AUTH_OTP_VERIFIED = 'OTP has been successfully verified',
    AUTH_LOGGED_IN = 'User has been successfully logged in',
    AUTH_WORKPLACE_CREATED = 'Workplace has been successfully created',

    // Error codes (4xx)
    AUTH_INVALID_CREDENTIALS = 'The provided credentials are invalid',
    AUTH_EMAIL_EXISTS = 'A user with this email already exists',
    AUTH_EMAIL_REQUIRED = 'Email is required',
    AUTH_PASSWORD_REQUIRED = 'Password is required',

    // Server error codes (5xx)
    AUTH_DATABASE_ERROR = 'An error occurred while processing the database operation',
    AUTH_UNKNOWN_ERROR = 'An unexpected error occurred during authentication'
} 