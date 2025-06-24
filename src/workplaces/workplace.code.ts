/**
 * Enum containing workplace-related status codes and messages
 */
export enum WorkplaceCode {
    
    // Success codes (2xx)
    WORKPLACE_CREATED = 'Workplace has been successfully created',
    WORKPLACE_UPDATED = 'Workplace has been successfully updated',
    WORKPLACE_DELETED = 'Workplace has been successfully deleted',
    WORKPLACE_FOUND = 'Workplace has been successfully retrieved',
    WORKPLACES_FOUND = 'Workplaces have been successfully retrieved',
    USER_WORKPLACES_FOUND = 'User workplaces have been successfully retrieved',
    WORKPLACE_SELECTED = 'Workplace has been successfully selected',

    // Error codes (4xx)
    WORKPLACE_NOT_FOUND = 'The requested workplace could not be found',
    WORKPLACE_ALREADY_EXISTS = 'A workplace with this name already exists',
    INVALID_WORKPLACE_NAME = 'The provided workplace name is not valid',
    USER_NOT_IN_WORKPLACE = 'The user is not a member of this workplace',
    INSUFFICIENT_PERMISSIONS = 'Insufficient permissions to perform this action',

    // Server error codes (5xx)
    DATABASE_ERROR = 'An error occurred while processing the database operation',
    CACHE_ERROR = 'An error occurred while accessing the cache system',
    VALIDATION_ERROR = 'The provided data failed validation checks',
    UNKNOWN_ERROR = 'An unexpected error occurred during the operation'
} 