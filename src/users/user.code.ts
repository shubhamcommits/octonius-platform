/**
 * Enum containing user-related status codes and messages
 */
export enum UserCode {
    // Success codes (2xx)
    USER_CREATED = 'User account has been successfully created',
    USER_UPDATED = 'User account has been successfully updated',
    USER_DELETED = 'User account has been successfully deleted',
    USER_FOUND = 'User account has been successfully retrieved',
    USERS_FOUND = 'User accounts have been successfully retrieved',
    USER_ADDED_TO_WORKPLACE = 'User has been successfully added to the workplace',
    USER_REMOVED_FROM_WORKPLACE = 'User has been successfully removed from the workplace',

    // Error codes (4xx)
    USER_NOT_FOUND = 'The requested user account could not be found',
    USER_ALREADY_EXISTS = 'A user account with this email already exists',
    INVALID_EMAIL = 'The provided email address is not valid',
    INVALID_PASSWORD = 'The provided password does not meet security requirements',
    INVALID_ROLE = 'The specified role is not valid or authorized',
    INVALID_WORKPLACE = 'The specified workplace is not valid or accessible',
    USER_IN_WORKPLACE = 'The user is already a member of this workplace',
    USER_NOT_IN_WORKPLACE = 'The user is not a member of this workplace',
    INVALID_CREDENTIALS = 'The provided credentials are invalid or expired',

    // Server error codes (5xx)
    DATABASE_ERROR = 'An error occurred while processing the database operation',
    CACHE_ERROR = 'An error occurred while accessing the cache system',
    VALIDATION_ERROR = 'The provided data failed validation checks',
    UNKNOWN_ERROR = 'An unexpected error occurred during the operation'
} 