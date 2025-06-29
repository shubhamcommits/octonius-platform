/**
 * Enum containing group-related status codes and messages
 */
export enum GroupCode {
    // Success codes (2xx)
    GROUP_CREATED = 'Work group has been successfully created',
    GROUP_UPDATED = 'Work group has been successfully updated',
    GROUP_DELETED = 'Work group has been successfully deleted',
    GROUP_FOUND = 'Work group has been successfully retrieved',
    GROUPS_FOUND = 'Work groups have been successfully retrieved',
    GROUP_MEMBER_ADDED = 'Member has been successfully added to the work group',
    GROUP_MEMBER_REMOVED = 'Member has been successfully removed from the work group',
    GROUP_MEMBER_UPDATED = 'Member role has been successfully updated in the work group',

    // Error codes (4xx)
    GROUP_NOT_FOUND = 'The requested work group could not be found',
    GROUP_ALREADY_EXISTS = 'A work group with this name already exists in this workplace',
    INVALID_GROUP_NAME = 'The provided group name is not valid',
    INVALID_GROUP_DESCRIPTION = 'The provided group description is not valid',
    INVALID_WORKPLACE = 'The specified workplace is not valid or accessible',
    MEMBER_ALREADY_IN_GROUP = 'The user is already a member of this work group',
    MEMBER_NOT_IN_GROUP = 'The user is not a member of this work group',
    INVALID_MEMBER_ROLE = 'The specified member role is not valid',
    INSUFFICIENT_PERMISSIONS = 'You do not have sufficient permissions to perform this action',
    GROUP_HAS_ACTIVE_TASKS = 'Cannot delete group with active tasks or ongoing work',

    // Server error codes (5xx)
    DATABASE_ERROR = 'An error occurred while processing the database operation',
    CACHE_ERROR = 'An error occurred while accessing the cache system',
    VALIDATION_ERROR = 'The provided data failed validation checks',
    UNKNOWN_ERROR = 'An unexpected error occurred during the operation'
} 