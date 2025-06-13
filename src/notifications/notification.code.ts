/**
 * Enum containing user-related status codes and messages
 */
export enum NotificationCode {

    // Email Notification
    SEND_EMAIL_SUCCESS = 'Email was sent successfully.',
    SEND_EMAIL_FAILURE = 'Unable to send the email, please try again.',
    SEND_EMAIL_CATCH = 'Unable to send the email. Internal server error.',

    // Server error codes (5xx)
    DATABASE_ERROR = 'An error occurred while processing the database operation',
    CACHE_ERROR = 'An error occurred while accessing the cache system',
    VALIDATION_ERROR = 'The provided data failed validation checks',
    UNKNOWN_ERROR = 'An unexpected error occurred during the operation'
} 